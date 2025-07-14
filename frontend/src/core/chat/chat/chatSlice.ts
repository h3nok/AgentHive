import { createSlice, PayloadAction, createAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { sessionsApi, SessionSummary, Session } from "./sessionsApi";
import { createSelector } from 'reselect';
import type { RootState } from '../../store';

// Define the shape of a single message
export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "assistant" | "system";
  timestamp: string; // ISO string format
  agent?: string; // Agent that sent or should receive the message
  temp?: boolean; // true for client-side placeholders (not persisted)
  chart?: React.ReactNode; // Optional chart component for system messages
  // Add other potential fields based on recommendations/analysis if needed later
  // e.g., reaction?: 'like' | 'dislike';
  // e.g., isProcessing?: boolean;
}

// Define folder structure
export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Define the collaborative workflow type
export interface WorkflowStep {
  agentId: string;
  status: "pending" | "processing" | "completed" | "error";
  input?: string;
  output?: string;
}

export interface CollaborativeWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: "pending" | "processing" | "completed" | "error";
  createdAt: string;
  updatedAt: string;
}

// Define a chat session
export interface ChatSession {
  id: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  pinned?: boolean;
  activeAgent?: string; // Currently active agent for this session
  workflow?: CollaborativeWorkflow; // Active workflow if any
}

// Define the shape of the chat state
interface ChatState {
  sessions: ChatSession[];
  folders: Folder[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  currentAssistantMessageId: string | null; // To track the message being streamed
  availableAgents: string[]; // List of available agent types
  lastUsedAgent: string; // Most recently used agent
  currentModel: string | null; // Currently selected model from backend
  processingStatus: string | null; // Informative backend status for UI
  routingMetadata: {
    selected_agent?: string;
    confidence?: number;
    intent?: string;
    routing_method?: string;
    routing_enabled?: boolean;
  } | null; // Intelligent routing information
  taskCounter: number; // Counter for task numbering
}

// Create a new session action
export const createNewSession = createAction<string | undefined>('chat/createNewSession');

// Define the initial state with a default session and folders
// const initialSessionId = uuidv4();
// const generalFolderId = uuidv4();

const initialState: ChatState = {
  sessions: [],
  folders: [ ],
  activeSessionId: null,
  isLoading: false,
  error: null,
  currentAssistantMessageId: null,
  availableAgents: ["lease", "general"], // Available agent types
  lastUsedAgent: "general", // Default last used agent
  currentModel: null, // Add to initial state
  processingStatus: null,
  routingMetadata: null, // Initialize routing metadata
  taskCounter: 0, // Initialize task counter
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Action to add a message (user or initial assistant placeholder)
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      /* ------------------------------------------------------------------
         Duplicate-insertion guard – prevents accidental double user bubbles
         or assistant echoes produced by race conditions.  Messages coming
         within 2 s with identical sender & text are ignored.
      ------------------------------------------------------------------ */
      if (state.activeSessionId) {
        const sess = state.sessions.find(s => s.id === state.activeSessionId);
        const last = sess?.messages[sess.messages.length - 1];
        const incoming = action.payload;
        if (last &&
            last.sender === incoming.sender &&
            last.text.trim() === incoming.text.trim() &&
            Math.abs(Date.parse(incoming.timestamp) - Date.parse(last.timestamp)) < 2000) {
          return; // drop duplicate
        }
      }

      // If no active session exists, create one automatically
      if (!state.activeSessionId) {
        const newSessionId = uuidv4();
        const nowIso = new Date().toISOString();
        
        // Ensure we have at least one folder
        if (state.folders.length === 0) {
          const defaultFolderId = uuidv4();
          state.folders.push({
            id: defaultFolderId,
            name: 'Default Session',
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
        
        const defaultFolder = state.folders.find(f => f.name === 'Default Session') || state.folders[0];
        
        // Create a default title based on the message content or timestamp
        let defaultTitle = 'New Chat';
        if (action.payload.sender === 'user') {
          const words = action.payload.text.trim().split(/\s+/).slice(0, 6);
          defaultTitle = words.join(' ');
          if (action.payload.text.length > defaultTitle.length) defaultTitle += '…';
        }
        
        const newSession: ChatSession = {
          id: newSessionId,
          title: defaultTitle,
          messages: [],
          createdAt: nowIso,
          updatedAt: nowIso,
          folderId: defaultFolder?.id,
          activeAgent: "general",
        };
        
        state.sessions.push(newSession);
        state.activeSessionId = newSessionId;
      }

      let activeSession = state.sessions.find(session => session.id === state.activeSessionId);

      // If session is not yet in state (e.g., just created in backend), add a minimal one
      if (!activeSession) {
        const nowIso = new Date().toISOString();
        const defaultFolder = state.folders.find(f => f.name === 'Default Session') || state.folders[0];
        const newSession: ChatSession = {
          id: state.activeSessionId!,
          title: undefined,
          messages: [],
          createdAt: nowIso,
          updatedAt: nowIso,
          folderId: defaultFolder?.id,
          activeAgent: "general",
        };
        state.sessions.push(newSession);
        activeSession = newSession;
      }

      if (!activeSession) return; // type guard, should not happen

      const sess = activeSession;
      sess.messages.push(action.payload);

      // Update the active agent for the session if it's a user message
      if (action.payload.sender === 'user' && action.payload.agent) {
        sess.activeAgent = action.payload.agent;
        state.lastUsedAgent = action.payload.agent;
      }

      // If this is the first message in the session, derive a title from it
      if (action.payload.sender === 'user' && sess.messages.length === 1) {
        const words = action.payload.text.trim().split(/\s+/).slice(0, 6);
        let newTitle = words.join(' ');
        if (action.payload.text.length > newTitle.length) newTitle += '…';
        sess.title = newTitle;
      }

      sess.updatedAt = new Date().toISOString();

      // Ensure session is attached to Default Session folder if none
      if (!sess.folderId) {
        const defaultFolder = state.folders.find(f => f.name === 'Default Session') || state.folders[0];
        sess.folderId = defaultFolder?.id;
      }

      // Force sessions array reference to update so selectors detect change
      state.sessions = [...state.sessions];
      state.error = null; // Clear error when a new message is added
    },
    // Action to indicate the assistant is starting to respond
    assistantRequestStarted: (state, action: PayloadAction<{ assistantMessageId: string }>) => {
      state.isLoading = true;
      state.error = null;
      state.currentAssistantMessageId = action.payload.assistantMessageId;
    },
    // Action to update the assistant's message content (e.g., streaming)
    updateAssistantMessage: (state, action: PayloadAction<{ id: string; text: string }>) => {
      if (state.activeSessionId) {
        const activeSession = state.sessions.find(session => session.id === state.activeSessionId);
        if (activeSession) {
          const messageIndex = activeSession.messages.findIndex(msg => msg.id === action.payload.id);
          if (messageIndex !== -1) {
            activeSession.messages[messageIndex].text = action.payload.text;
            activeSession.updatedAt = new Date().toISOString();
          }
        }
      }
    },
    // Action to indicate the assistant's response is complete
    assistantResponseFinished: (state) => {
      state.isLoading = false;
      state.currentAssistantMessageId = null;
      state.processingStatus = null;
    },
    // Action to indicate an error occurred
    setError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.currentAssistantMessageId = null;
    },
    // Action to set the active session
    setActiveSession: (state, action: PayloadAction<string>) => {
      state.activeSessionId = action.payload;
    },
    // Action to update session title
    updateSessionTitle: (state, action: PayloadAction<{ sessionId: string; title: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        session.title = action.payload.title;
        session.updatedAt = new Date().toISOString();
      }
    },
    // Action to delete a session
    deleteSession: (state, action: PayloadAction<string>) => {
      const sessionIndex = state.sessions.findIndex(s => s.id === action.payload);
      
      // If the session exists, remove it
      if (sessionIndex !== -1) {
        // If the deleted session is the active one, set active to another session or null
        if (state.activeSessionId === action.payload) {
          // Find another session to make active
          if (state.sessions.length > 1) {
            // Use the session before this one, or after if this is the first
            const newActiveIndex = sessionIndex === 0 ? 1 : sessionIndex - 1;
            state.activeSessionId = state.sessions[newActiveIndex].id;
          } else {
            // If this was the last session, set to null
            state.activeSessionId = null;
          }
        }
        
        // Remove the session
        state.sessions.splice(sessionIndex, 1);
      }
    },
    // Action to create a new folder
    createFolder: (state, action: PayloadAction<string>) => {
      const folderId = uuidv4();
      const timestamp = new Date().toISOString();
      
      state.folders.push({
        id: folderId,
        name: action.payload,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },
    // Action to update a folder name
    updateFolderName: (state, action: PayloadAction<{ folderId: string; name: string }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) {
        folder.name = action.payload.name;
        folder.updatedAt = new Date().toISOString();
      }
    },
    // Action to delete a folder
    deleteFolder: (state, action: PayloadAction<string>) => {
      const folderIndex = state.folders.findIndex(f => f.id === action.payload);
      
      if (folderIndex !== -1) {
        // Move all sessions in this folder to General or first available folder
        const defaultFolderId = state.folders.find(f => f.id !== action.payload)?.id;
        
        // Only proceed with deletion if there's at least one other folder
        if (defaultFolderId) {
          // Update all sessions that were in this folder
          state.sessions.forEach(session => {
            if (session.folderId === action.payload) {
              session.folderId = defaultFolderId;
              session.updatedAt = new Date().toISOString();
            }
          });
          
          // Remove the folder
          state.folders.splice(folderIndex, 1);
        }
      }
    },
    // Action to move a session to a folder
    moveSessionToFolder: (state, action: PayloadAction<{ sessionId: string; folderId: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        session.folderId = action.payload.folderId;
        session.updatedAt = new Date().toISOString();
      }
    },
    // Action to toggle pinned status for a session
    toggleSessionPinned: (state, action: PayloadAction<string>) => {
      const session = state.sessions.find(s => s.id === action.payload);
      if (session) {
        session.pinned = !session.pinned;
        session.updatedAt = new Date().toISOString();
      }
    },
    // Optional: Action to clear all messages in active session
    clearChat: (state) => {
      if (state.activeSessionId) {
        const activeSession = state.sessions.find(session => session.id === state.activeSessionId);
        if (activeSession) {
          activeSession.messages = [];
          activeSession.updatedAt = new Date().toISOString();
        }
      }
      state.error = null;
      state.isLoading = false;
      state.currentAssistantMessageId = null;
    },
    // Action to remove the last assistant message (for rerun in place)
    removeLastAssistantMessage: (state) => {
      if (state.activeSessionId) {
        const activeSession = state.sessions.find(session => session.id === state.activeSessionId);
        if (activeSession && activeSession.messages.length > 0) {
          // Find the last assistant message
          const messageIndex = [...activeSession.messages].reverse().findIndex(msg => msg.sender === 'assistant');
          if (messageIndex >= 0) {
            // Convert the reverse index to the actual index
            const actualIndex = activeSession.messages.length - 1 - messageIndex;
            activeSession.messages.splice(actualIndex, 1);
            activeSession.updatedAt = new Date().toISOString();
          }
        }
      }
    },
    // Action to set the active agent for the current session
    setActiveAgent: (state, action: PayloadAction<string>) => {
      if (state.activeSessionId) {
        const activeSession = state.sessions.find(session => session.id === state.activeSessionId);
        if (activeSession) {
          activeSession.activeAgent = action.payload;
          state.lastUsedAgent = action.payload;
        }
      }
    },
    // Action to start a collaborative workflow
    startWorkflow: (state, action: PayloadAction<{workflowId: string, name: string, agentIds: string[]}>) => {
      if (state.activeSessionId) {
        const activeSession = state.sessions.find(session => session.id === state.activeSessionId);
        if (activeSession) {
          // Create steps from the agent IDs
          const steps = action.payload.agentIds.map(agentId => ({
            agentId,
            status: "pending" as const
          }));
          
          // Set the workflow
          activeSession.workflow = {
            id: action.payload.workflowId,
            name: action.payload.name,
            steps,
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Set first agent as active
          if (steps.length > 0) {
            activeSession.activeAgent = steps[0].agentId;
          }
          
          activeSession.updatedAt = new Date().toISOString();
        }
      }
    },
    // Action to update a workflow step
    updateWorkflowStep: (state, action: PayloadAction<{
      stepIndex: number, 
      status: "pending" | "processing" | "completed" | "error",
      input?: string,
      output?: string
    }>) => {
      if (state.activeSessionId) {
        const activeSession = state.sessions.find(session => session.id === state.activeSessionId);
        if (activeSession && activeSession.workflow) {
          const { stepIndex, status, input, output } = action.payload;
          if (activeSession.workflow.steps[stepIndex]) {
            activeSession.workflow.steps[stepIndex].status = status;
            
            if (input !== undefined) {
              activeSession.workflow.steps[stepIndex].input = input;
            }
            
            if (output !== undefined) {
              activeSession.workflow.steps[stepIndex].output = output;
            }
            
            // If this step is completed and there's a next step, move to it
            if (status === "completed" && stepIndex < activeSession.workflow.steps.length - 1) {
              activeSession.activeAgent = activeSession.workflow.steps[stepIndex + 1].agentId;
            }
            
            // Update workflow status based on steps
            const allCompleted = activeSession.workflow.steps.every(step => step.status === "completed");
            const anyError = activeSession.workflow.steps.some(step => step.status === "error");
            
            if (allCompleted) {
              activeSession.workflow.status = "completed";
            } else if (anyError) {
              activeSession.workflow.status = "error";
            } else if (activeSession.workflow.steps.some(step => step.status === "processing")) {
              activeSession.workflow.status = "processing";
            }
            
            activeSession.workflow.updatedAt = new Date().toISOString();
            activeSession.updatedAt = new Date().toISOString();
          }
        }
      }
    },
    // Action to cancel the current workflow
    cancelWorkflow: (state) => {
      if (state.activeSessionId) {
        const activeSession = state.sessions.find(session => session.id === state.activeSessionId);
        if (activeSession) {
          delete activeSession.workflow;
          activeSession.updatedAt = new Date().toISOString();
        }
      }
    },
    setCurrentModel: (state, action: PayloadAction<string | null>) => {
      state.currentModel = action.payload;
    },
    setRoutingMetadata: (state, action: PayloadAction<{
      selected_agent?: string;
      confidence?: number;
      intent?: string;
      routing_method?: string;
      routing_enabled?: boolean;
    } | null>) => {
      state.routingMetadata = action.payload;
    },
    clearRoutingMetadata: (state) => {
      state.routingMetadata = null;
    },
    // Clear messages in specified session
    clearSessionMessages: (state, action: PayloadAction<string>) => {
      const sess = state.sessions.find(s => s.id === action.payload);
      if (sess) {
        sess.messages = [];
        sess.updatedAt = new Date().toISOString();
        if (state.activeSessionId === sess.id) {
          state.isLoading = false;
          state.error = null;
          state.currentAssistantMessageId = null;
        }
      }
    },
    // Update processing status string during SSE
    setProcessingStatus: (state, action: PayloadAction<string | null>) => {
      state.processingStatus = action.payload;
    },
    clearProcessingStatus: (state) => {
      state.processingStatus = null;
    },
    // Action to increment the task counter
    incrementTaskCounter: (state) => {
      state.taskCounter += 1;
    },
    // Action to fix legacy session names (rename "New Chat" -> "Task N")
    fixLegacySessionNames: (state) => {
      let currentMaxTaskNumber = state.taskCounter;
      
      state.sessions.forEach(session => {
        // Check if this is a legacy "Chat" or "Session" name that needs updating
        if (session.title && 
            (session.title.includes('New Chat') || 
             session.title.includes('Chat ') ||
             (session.title.includes('Session ') && !session.title.startsWith('Task ')))) {
          
          currentMaxTaskNumber += 1;
          session.title = `Task ${currentMaxTaskNumber}`;
          session.updatedAt = new Date().toISOString();
        }
      });
      
      // Update the task counter to reflect the highest task number used
      state.taskCounter = currentMaxTaskNumber;
    },
    // Add other actions as needed (e.g., editMessage, addReaction)
    /**
     * Merge (or insert) a batch of messages fetched from backend into the
     * store for a given session.  
     * – Updates `updatedAt` and guarantees chronological order without dupes.  
     * – Intended for `useGetSessionQuery` responses.
     */
    upsertMessages: (state, action: PayloadAction<{ sessionId: string; messages: ChatMessage[] }>) => {
      const { sessionId, messages } = action.payload;
      let sess = state.sessions.find((s) => s.id === sessionId);

      if (!sess) {
        // If the session isn't in the local cache yet, create a shell so the UI can render immediately.
        const nowIso = new Date().toISOString();
        sess = {
          id: sessionId,
          title: undefined,
          messages: [],
          folderId: state.folders[0]?.id,
          createdAt: nowIso,
          updatedAt: nowIso,
          activeAgent: 'general',
        } as ChatSession;
        state.sessions.push(sess);
      }

      // Build a map for fast duplicate check by id.
      const existingIds = new Set(sess.messages.map((m) => m.id));
      messages.forEach((m) => {
        if (!existingIds.has(m.id)) {
          sess!.messages.push(m);
        }
      });

      // Ensure chronological order (ASC).
      sess.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      sess.updatedAt = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createNewSession, (state, action) => {
      const newSessionId = uuidv4();
      // Use the provided folderId if available, otherwise default to the first folder
      const defaultFolderId = action.payload || (state.folders.length > 0 ? state.folders[0].id : undefined);
      
      // Create a default title based on date
      const now = new Date();
      const defaultTitle = `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      
      state.sessions.push({
        id: newSessionId,
        title: defaultTitle,
        messages: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        folderId: defaultFolderId,
        activeAgent: "general", // Default to general agent
      });
      state.activeSessionId = newSessionId;
      state.isLoading = false;
      state.error = null;
      state.currentAssistantMessageId = null;
    });

    // Sync session list from backend summaries
    builder.addMatcher(
      sessionsApi.endpoints.listSessions.matchFulfilled,
      (state, action: { payload: SessionSummary[] }) => {
        const summaries = action.payload;
        summaries.forEach((remote) => {
          const existing = state.sessions.find((s) => s.id === remote.session_id);
          if (existing) {
            existing.title = remote.title;
            existing.pinned = remote.pinned;
            existing.updatedAt = remote.updated_at;
          } else {
            state.sessions.push({
              id: remote.session_id,
              title: remote.title,
              pinned: remote.pinned,
              createdAt: remote.updated_at,
              updatedAt: remote.updated_at,
              messages: [],
              folderId: state.folders[0]?.id,
              activeAgent: "general",
            });
          }
        });

        // Ensure at least one folder exists
        if (state.sessions.length > 0 && state.folders.length === 0) {
          const defaultFolderId = uuidv4();
          const nowIso = new Date().toISOString();
          state.folders.push({
            id: defaultFolderId,
            name: 'Default Session',
            createdAt: nowIso,
            updatedAt: nowIso,
          });

          // Assign any sessions missing folderId to default
          state.sessions.forEach(s => {
            if (!s.folderId) s.folderId = defaultFolderId;
          });
        }
      }
    );

    // Sync individual session with full messages
    builder.addMatcher(
      sessionsApi.endpoints.getSession.matchFulfilled,
      (state, action: { payload: Session }) => {
        const remote = action.payload;
        const existing = state.sessions.find((s) => s.id === remote.session_id);
        if (existing) {
          existing.title = remote.title;
          existing.pinned = remote.pinned;
          existing.updatedAt = remote.updated_at;
          existing.messages = normaliseRemoteMessages(remote.messages as any);
        } else {
          state.sessions.push({
            id: remote.session_id,
            title: remote.title,
            pinned: remote.pinned,
            createdAt: remote.updated_at,
            updatedAt: remote.updated_at,
            messages: normaliseRemoteMessages(remote.messages as any),
            folderId: state.folders[0]?.id,
            activeAgent: "general",
          });
        }
      }
    );

    // Add new session on create
    builder.addMatcher(
      sessionsApi.endpoints.createSession.matchFulfilled,
      (state, action: { payload: SessionSummary }) => {
        const remote = action.payload;
        const exists = state.sessions.find((s) => s.id === remote.session_id);
        const defaultFolder = state.folders.find(f => f.name === 'Default Session') || state.folders[0];
        if (!exists) {
          state.sessions.push({
            id: remote.session_id,
            title: remote.title,
            pinned: remote.pinned,
            createdAt: remote.updated_at,
            updatedAt: remote.updated_at,
            messages: [],
            folderId: defaultFolder?.id,
            activeAgent: "general",
          });
        } else {
          if (!exists.folderId) {
            exists.folderId = defaultFolder?.id;
          }
          if (!exists.title) {
            exists.title = remote.title;
          }
        }
        // Always switch to the newly created session so UI renders predictably
        state.activeSessionId = remote.session_id;
      }
    );

    // Remove session on delete
    builder.addMatcher(
      sessionsApi.endpoints.deleteSession.matchFulfilled,
      (state, action) => {
        const id = (action as any).meta.arg.originalArgs ?? (action as any).meta.arg;
        const idx = state.sessions.findIndex(s => s.id === id);
        if (idx !== -1) {
          state.sessions.splice(idx, 1);
          if (state.activeSessionId === id) {
            state.activeSessionId = state.sessions[0]?.id || null;
          }
        }
      }
    );

    // Patch session title/pinned on update
    builder.addMatcher(
      sessionsApi.endpoints.updateSession.matchFulfilled,
      (state, action) => {
        const { id, changes } = (action as any).meta.arg.originalArgs ?? (action as any).meta.arg;
        const sess = state.sessions.find(s => s.id === id);
        if (sess) {
          if (changes.title !== undefined) sess.title = changes.title;
          if (changes.pinned !== undefined) sess.pinned = changes.pinned;
          sess.updatedAt = new Date().toISOString();
        }
      }
    );
  }
});

// Export actions
export const {
  addMessage,
  assistantRequestStarted,
  updateAssistantMessage,
  assistantResponseFinished,
  setError,
  clearChat,
  setActiveSession,
  updateSessionTitle,
  deleteSession,
  createFolder,
  updateFolderName,
  deleteFolder,
  moveSessionToFolder,
  toggleSessionPinned,
  removeLastAssistantMessage,
  setActiveAgent,
  startWorkflow,
  updateWorkflowStep,
  cancelWorkflow,
  setCurrentModel,
  setRoutingMetadata,
  clearRoutingMetadata,
  setProcessingStatus,
  clearProcessingStatus,
  clearSessionMessages,
  upsertMessages,
  incrementTaskCounter,
  fixLegacySessionNames
} = chatSlice.actions;

// Export reducer
export default chatSlice.reducer;

// -----------------  Selectors  -------------------------------------------

/**
 * Memoized selector returning all messages for a given session id.
 */
export const selectMessagesBySessionId = (sessionId: string | null) =>
  createSelector(
    (state: RootState) => state.chat.sessions,
    (sessions) => {
      if (!sessionId) return [];
      const sess = sessions.find((s) => s.id === sessionId);
      return sess?.messages ?? [];
    }
  );

// --- Helper utilities -----------------------------------------------------

/**
 * Normalises the incoming message payload from the backend – adds missing
 * fields, guarantees chronological order and removes duplicates (which can
 * surface when the backend returns overlapping system-generated and user
 * entries).
 */
function normaliseRemoteMessages(msgs: any[]): ChatMessage[] {
  const mapped: ChatMessage[] = msgs.map((m: any) => {
    const id = m.message_id || m.id || uuidv4();
    const timestamp = m.created_at || m.timestamp || new Date().toISOString();
    const sender = ((): 'user' | 'assistant' | 'system' => {
      const role = m.role || m.sender;
      if (role === 'user') return 'user';
      if (role === 'assistant' || role === 'agent') return 'assistant';
      return 'system';
    })();

    return {
      id,
      text: m.content || m.text || '',
      sender,
      timestamp,
      agent: m.agent || undefined,
    };
  });

  // First pass: prefer uniqueness by explicit id
  const uniqueById = new Map<string, ChatMessage>();
  for (const m of mapped) {
    if (!uniqueById.has(m.id)) {
      uniqueById.set(m.id, m);
    }
  }

  const normaliseText = (t: string) => t.trim().replace(/\s+/g, ' ');

  const isContentDuplicate = (existing: string, incoming: string) => {
    const a = normaliseText(existing.toLowerCase().replace(/[^a-z0-9 ]+/g, ''));
    const b = normaliseText(incoming.toLowerCase().replace(/[^a-z0-9 ]+/g, ''));
    if (a === b || a.startsWith(b) || b.startsWith(a)) return true;
    const tokensA = new Set(a.split(' '));
    const tokensB = new Set(b.split(' '));
    const intersectionSize = [...tokensA].filter(t => tokensB.has(t)).length;
    const jaccard = intersectionSize / Math.max(tokensA.size, tokensB.size);
    if (jaccard > 0.75) return true;
    // Rough char similarity
    const shorterLen = Math.min(a.length, b.length);
    let matchCount = 0;
    for (let i = 0; i < shorterLen; i++) {
      if (a[i] === b[i]) matchCount++;
    }
    return matchCount / shorterLen > 0.8;
  };

  // Second pass: remove semantic duplicates where different ids/share same text+sender
  const uniqueMap = new Map<string, ChatMessage>();
  for (const msg of uniqueById.values()) {
    // Iterate over existing entries to detect fuzzy duplicate
    let found = false;
    for (const [key, existingMsg] of uniqueMap) {
      if (
        existingMsg.sender === msg.sender &&
        isContentDuplicate(existingMsg.text, msg.text)
      ) {
        // Keep the longer / newer content (prefers final full assistant reply)
        if (msg.text.length > existingMsg.text.length) {
          uniqueMap.set(key, msg);
        }
        found = true;
        break;
      }
    }
    if (!found) {
      const key = `${msg.sender}-${normaliseText(msg.text).slice(0, 60)}`;
      uniqueMap.set(key, msg);
    }
  }

  // Chronological ASC order
  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

