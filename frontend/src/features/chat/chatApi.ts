import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ChatMessage, addMessage, updateAssistantMessage, assistantResponseFinished, setError, assistantRequestStarted, updateSessionTitle, setCurrentModel, setProcessingStatus, clearProcessingStatus, setRoutingMetadata, clearRoutingMetadata } from "./chatSlice"; // Adjust path
import { RootState } from "../../store";
import { processErrorMessages } from '../../utils/errorHandling';
import { MessageNotSentError, ApiConnectionError, StreamingError, getUserFriendlyErrorMessage, isExtensionError } from '../../utils/chatErrors';

// API Config
// Use environment variable or fallback to local development server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const AGENT_QUERY_ENDPOINT = `${API_BASE_URL}/v1/agent/query`;

// For debugging - log the endpoint being used
console.log("API endpoint being used:", AGENT_QUERY_ENDPOINT);

// Define the expected request body
interface AgentQueryRequest {
  session_id: string;
  query: string;
  explicit_agent?: string;
  stream?: boolean;
}

// Define the expected response body (adjust based on actual API)
interface AgentQueryResponse {
  response: string; // Assuming a simple text response for now
  model?: string; // Add model field
  // Add other fields like messageId, structured data if the API provides them
}

// Response types from the backend
interface StreamResponse {
  type: "status" | "delta" | "error" | "routing";
  delta: string;
  model?: string; // Add model field for SSE
  metadata?: {
    selected_agent?: string;
    confidence?: number;
    intent?: string;
    routing_method?: string;
    routing_enabled?: boolean;
  };
}

// Helper to generate a title from the first message
const generateSessionTitle = (message: string): string => {
  // Truncate to a reasonable title length (max 30 chars)
  if (message.length <= 30) {
    return message;
  }
  
  // Try to find a good breaking point
  const breakPoints = ['.', '?', '!', ',', ';', ':', ' '];
  
  for (const point of breakPoints) {
    const index = message.indexOf(point, 15); // Look for break points after 15 chars
    if (index > 0 && index < 30) {
      return message.substring(0, index + 1);
    }
  }
  
  // If no good break point, just truncate
  return message.substring(0, 27) + '...';
};

// Add debounce utility (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debounce = (func: (...args: unknown[]) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Add improved token batch processing utility
const createTokenBatcher = (onBatch: (tokens: string) => void) => {
  let tokenBuffer: string[] = [];
  let animationFrameId: number | null = null;
  let batchSize = 2; // Start with small batches for smooth appearance
  let charsProcessed = 0;
  
  const processBatch = () => {
    animationFrameId = null;
    if (tokenBuffer.length > 0) {
      const batch = tokenBuffer.join('');
      tokenBuffer = [];
      onBatch(batch);
      
      // Adaptive batch sizing - increase batch size gradually as more content is processed
      charsProcessed += batch.length;
      if (charsProcessed > 500) {
        batchSize = Math.min(7, batchSize + 1); // Gradually increase batch size for longer messages
      }
    }
  };

  return {
    add: (token: string) => {
      tokenBuffer.push(token);
      
      // Schedule processing on next animation frame if not already scheduled
      if (tokenBuffer.length >= batchSize && !animationFrameId) {
        animationFrameId = requestAnimationFrame(processBatch);
      }
    },
    flush: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (tokenBuffer.length > 0) {
        processBatch();
      }
    }
  };
};

// Define a service using a base URL and expected endpoints
export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }), // attach auth header
  endpoints: (builder) => ({
    agentQuery: builder.mutation<AgentQueryResponse, AgentQueryRequest>({
      // Prevent default baseQuery request – we'll handle streaming manually in onQueryStarted
      queryFn: async () => ({ data: {} as AgentQueryResponse }),
      // Robust implementation for handling Server-Sent Events (SSE)
      async onQueryStarted(arg, { dispatch, getState }) {
        // Create a unique message ID for the assistant response
        const assistantMessageId = `assistant-${Date.now()}`;
        
        // Check if this is the first message in a session
        const state = getState() as RootState;
        const activeSessionId = state.chat.activeSessionId;
        
        if (activeSessionId) {
          const activeSession = state.chat.sessions.find(s => s.id === activeSessionId);
          
          // If this is the first message and the session doesn't have a title yet
          if (activeSession && activeSession.messages.length === 0 && !activeSession.title) {
            const sessionTitle = generateSessionTitle(arg.query);
            dispatch(updateSessionTitle({ sessionId: activeSessionId, title: sessionTitle }));
          }
        }
        
        // Notify UI that backend initialisation has started
        console.log('🚀 ChatApi: Setting initial processing status');
        dispatch(setProcessingStatus('📡 Connecting to model…'));
        
        // Clear any previous routing metadata
        dispatch(clearRoutingMetadata());

        // Create a placeholder message while waiting for the response
        const assistantPlaceholder: ChatMessage = {
          id: assistantMessageId,
          text: "", // Empty text instead of "Thinking..." placeholder
          sender: "assistant",
          timestamp: new Date().toISOString(),
          temp: true,
        };
        
        // Add the placeholder to the chat and update state
        console.log('📝 ChatApi: Adding assistant placeholder and starting request');
        dispatch(addMessage(assistantPlaceholder));
        
        // Debug: Check state before setting loading to true
        const stateBefore = getState() as RootState;
        console.log('🔍 ChatApi: State before assistantRequestStarted:', {
          isLoading: stateBefore.chat.isLoading,
          currentAssistantMessageId: stateBefore.chat.currentAssistantMessageId
        });
        
        dispatch(assistantRequestStarted({ assistantMessageId }));
        
        // Debug: Check state after setting loading to true
        const stateAfter = getState() as RootState;
        console.log('✅ ChatApi: State after assistantRequestStarted:', {
          isLoading: stateAfter.chat.isLoading,
          currentAssistantMessageId: stateAfter.chat.currentAssistantMessageId,
          assistantMessageId: assistantMessageId
        });

        try {
          console.log("Connecting to API:", AGENT_QUERY_ENDPOINT);
          
          // Create an AbortController to handle cancellation
          const controller = new AbortController();
          const { signal } = controller;
          
          // Handle cleanup if the component unmounts or the query is cancelled
          // Note: Using our own AbortController for manual stream management
          // This avoids TypeScript errors with the complex type
          
          // Always hit the generic agent/query endpoint; the agent type is passed in the body
          const url = `${API_BASE_URL}/v1/agent/query`;
          
          // Prepare request body with explicit agent if specified
          const requestBody: AgentQueryRequest = {
            session_id: arg.session_id,
            query: arg.query,
            explicit_agent: (arg as any).agent, // Temporary type assertion to fix build
            stream: true
          };
          
          const authToken = localStorage.getItem('access_token');
          let response: Response | null = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            response = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify(requestBody),
              signal,
            });

            if (response.ok) break;

            // If session isn't yet visible in DB we may get 404; retry after short delay
            if (response.status === 404) {
              await new Promise((res) => setTimeout(res, 500));
              continue;
            }

            // Other status codes don't benefit from retry
            break;
          }

          if (!response || !response.ok) {
            const errorStatus = response ? response.status : 'no_response';
            console.error(`API request failed with status: ${errorStatus}`);
            throw new Error(`HTTP error! status: ${errorStatus}`);
          }

          if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let processingBuffer = "";
            let done = false;
            
            // Create token batcher for smoother updates
            let hasReceivedContent = false;
            const processingStartTime = Date.now();
            const MIN_PROCESSING_DISPLAY_TIME = 3000; // Increased from 800ms to 3000ms for debugging
            
            const tokenBatcher = createTokenBatcher((batch) => {
              fullText += batch;
              console.log(`📦 TokenBatcher: Received batch (${batch.length} chars), total: ${fullText.length}`);
              
              // Clear processing status after we have some meaningful content AND minimum display time
              if (!hasReceivedContent && fullText.trim().length > 3) {
                const elapsedTime = Date.now() - processingStartTime;
                console.log(`⏰ TokenBatcher: ${elapsedTime}ms elapsed, content length: ${fullText.trim().length}`);
                
                if (elapsedTime >= MIN_PROCESSING_DISPLAY_TIME) {
                  hasReceivedContent = true;
                  console.log('✅ TokenBatcher: Clearing processing status (time elapsed)');
                  dispatch(clearProcessingStatus());
                } else {
                  console.log(`⏳ TokenBatcher: Delaying clear by ${MIN_PROCESSING_DISPLAY_TIME - elapsedTime}ms`);
                  // Delay clearing the processing status to ensure it's visible
                  setTimeout(() => {
                    hasReceivedContent = true;
                    console.log('✅ TokenBatcher: Clearing processing status (delayed)');
                    dispatch(clearProcessingStatus());
                  }, MIN_PROCESSING_DISPLAY_TIME - elapsedTime);
                }
              }
              dispatch(updateAssistantMessage({ 
                id: assistantMessageId, 
                text: processErrorMessages(fullText)
              }));
            });
            
            // Process the stream
            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              
              if (value) {
                const chunk = decoder.decode(value, { stream: !done });
                processingBuffer += chunk;
                
                // Process complete SSE messages
                const messages = processingBuffer.split(/\n\n/).filter(msg => msg.trim());
                
                // Keep incomplete message in buffer
                if (!done && !processingBuffer.endsWith('\n\n')) {
                  const lastNewlineIndex = processingBuffer.lastIndexOf('\n\n');
                  if (lastNewlineIndex !== -1) {
                    processingBuffer = processingBuffer.substring(lastNewlineIndex + 2);
                  }
                } else {
                  processingBuffer = '';
                }
                
                // Process each complete message
                for (const message of messages) {
                  if (!message.trim()) continue;
                  
                  const lines = message.split('\n');
                  const dataLines = lines.filter(line => line.startsWith('data: '));
                  
                  for (const line of dataLines) {
                    try {
                      const jsonStr = line.substring(6);
                      const jsonData = JSON.parse(jsonStr) as StreamResponse;
                      
                      // NEW: If model is present, dispatch it
                      if (jsonData.model) {
                        dispatch(setCurrentModel(jsonData.model));
                      }
                      
                      switch (jsonData.type) {
                        case 'status':
                          // Update processing status with backend status messages
                          if (jsonData.delta) {
                            console.log(`📊 SSE Status: "${jsonData.delta}"`);
                            dispatch(setProcessingStatus(jsonData.delta));
                          }
                          break;
                          
                        case 'routing':
                          // Handle intelligent routing metadata
                          if (jsonData.metadata) {
                            dispatch(setRoutingMetadata(jsonData.metadata));
                          }
                          break;
                          
                        case 'delta':
                          // Process token with adaptive batching
                          // (processing status will be cleared by the token batcher once we have meaningful content)
                          console.log(`🔤 SSE Delta: "${jsonData.delta}"`);
                          tokenBatcher.add(jsonData.delta);
                          break;
                          
                        case 'error':
                          throw new Error(jsonData.delta);
                          
                        default:
                          console.warn("Unknown response type:", jsonData.type);
                      }
                    } catch (e) {
                      console.error("Error parsing SSE data:", e, line);
                    }
                  }
                }
              }
            }
            
            // Flush any remaining tokens in the buffer
            tokenBatcher.flush();
            
            console.log('🏁 ChatApi: Stream completed, calling assistantResponseFinished');
            dispatch(assistantResponseFinished());
            dispatch(clearProcessingStatus());
          } else {
            throw new Error("Response body is null");
          }
        } catch (error: unknown) {
          console.error("API Query Error:", error);
          console.log('❌ ChatApi: Error occurred, calling assistantResponseFinished');
          
          // Check if it's an extension error we should ignore
          if (isExtensionError(error)) {
            // Silently ignore extension errors
            console.log('🔇 ChatApi: Extension error ignored, calling assistantResponseFinished');
            dispatch(assistantResponseFinished());
            dispatch(clearProcessingStatus());
            return;
          }
          
          let errorMessage = "Failed to get response from assistant.";
          
          // Extract the error message safely
          if (error && typeof error === 'object') {
            const errorObj = error as { error?: { message?: string }; message?: string };
            if (errorObj.error?.message) {
               errorMessage = errorObj.error.message;
            } else if (errorObj.message) {
               errorMessage = errorObj.message;
            }
          }
          
          // Create appropriate error type
          let chatError: Error;
          if (errorMessage.includes("404")) {
            chatError = new ApiConnectionError("The API endpoint could not be found (404). Please ensure the backend server is running and the API URL is correct.");
          } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
            chatError = new ApiConnectionError("Network error: Could not connect to the API. Please check that the backend server is running.");
          } else if (errorMessage.includes("aborted")) {
            chatError = new StreamingError("Request was cancelled.");
          } else if (errorMessage.includes("403")) {
            chatError = new ApiConnectionError("Access denied (403). Please check your permissions or contact support.");
          } else if (errorMessage.includes("Public access is disabled")) {
            chatError = new ApiConnectionError("Network error: Unable to connect to the AI service due to VPN restrictions. Please check your VPN settings or contact support.");
          } else {
            chatError = new MessageNotSentError(errorMessage);
          }
          
          // Handle database-specific errors more gracefully
          if (errorMessage.includes("Database error") || 
              errorMessage.includes("SQL") || 
              errorMessage.includes("coroutine")) {
            chatError = new MessageNotSentError("The request required a database connection, but none is available. I can still provide general information based on my knowledge.");
          }
          
          const friendlyMessage = getUserFriendlyErrorMessage(chatError);
          
          // Update the placeholder message with the error
          dispatch(updateAssistantMessage({ 
            id: assistantMessageId, 
            text: `Error: ${friendlyMessage}`
          }));
          
          dispatch(setError(friendlyMessage)); // Also update general error state
          console.log('❌ ChatApi: Error handled, calling assistantResponseFinished');
          dispatch(assistantResponseFinished());
          dispatch(clearProcessingStatus());
        }
      },
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useAgentQueryMutation } = chatApi;

