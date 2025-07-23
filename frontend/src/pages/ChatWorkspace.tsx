import React, { useEffect } from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '../shared/store';
import AgenticChatInterface from '../features/agentic-ui/components/AgenticChatInterface';
import {
  selectActiveSessionId,
  selectMessagesBySession,
  setMessages,
  addMessage,
  addSession,
  setActiveSession,
  selectAllSessions,
} from '../shared/store/slices/entitiesSlice';
import {
  useGetSessionMessagesQuery,
  useSendMessageMutation,
} from '../shared/store/api/apiSlice';
import { Box, CircularProgress, Stack } from '@mui/material';
import SessionsSidebar from '../core/chat/SessionsSidebar';

/**
 * ChatWorkspace – container component that wires ChatInterface to Redux + RTK-Query.
 */
const ChatWorkspace: React.FC = () => {
  console.log('🟢 CHATWORKSPACE COMPONENT EXECUTING - THIS SHOULD APPEAR IN CONSOLE!');
  const dispatch = useAppDispatch();

  // Redux selectors with COMPREHENSIVE DEBUGGING
  const activeSessionId = useAppSelector(selectActiveSessionId);
  
  // DIRECT REDUX STATE INSPECTION - ACTUAL RUNNING COMPONENT
  const messages = useAppSelector((state) => {
    console.log('🔬 ChatWorkspace DIRECT STATE INSPECTION: Full Redux state:', state);
    console.log('🔬 ChatWorkspace DIRECT STATE INSPECTION: state.entities:', state.entities);
    console.log('🔬 ChatWorkspace DIRECT STATE INSPECTION: state.entities.messages:', state.entities?.messages);
    console.log('🔬 ChatWorkspace DIRECT STATE INSPECTION: state.entities.messages.entities:', state.entities?.messages?.entities);
    console.log('🔬 ChatWorkspace DIRECT STATE INSPECTION: state.entities.messages.ids:', state.entities?.messages?.ids);
    
    // Manual message extraction without selectors
    const messageEntities = state.entities?.messages?.entities || {};
    const messageIds = state.entities?.messages?.ids || [];
    const allMessagesRaw = messageIds.map(id => messageEntities[id]).filter(Boolean);
    
    console.log('🔬 ChatWorkspace DIRECT EXTRACTION: messageIds:', messageIds);
    console.log('🔬 ChatWorkspace DIRECT EXTRACTION: messageEntities:', messageEntities);
    console.log('🔬 ChatWorkspace DIRECT EXTRACTION: allMessagesRaw:', allMessagesRaw);
    
    // Filter by session ID manually
    const sessionMessages = activeSessionId 
      ? allMessagesRaw.filter(msg => msg && msg.sessionId === activeSessionId)
      : [];
    
    console.log('🔬 ChatWorkspace DIRECT FILTERING: activeSessionId:', activeSessionId);
    console.log('🔬 ChatWorkspace DIRECT FILTERING: sessionMessages:', sessionMessages);
    
    // Compare with selector results
    if (activeSessionId) {
      const selectorResult = selectMessagesBySession(state as any, activeSessionId);
      console.log('🔬 ChatWorkspace SELECTOR COMPARISON: selectMessagesBySession result:', selectorResult);
      console.log('🔬 ChatWorkspace SELECTOR COMPARISON: manual vs selector equal:', JSON.stringify(sessionMessages) === JSON.stringify(selectorResult));
    }
    
    return sessionMessages;
  });
  
  console.log('📋 ChatWorkspace: Active session:', activeSessionId, 'Messages count:', messages.length);
  console.log('📋 ChatWorkspace: Actual messages array:', messages);
  
  const sessions = useAppSelector(selectAllSessions).map(session => ({
    id: session.id,
    title: session.title || 'New Chat',
    lastMessage: messages.filter(m => m.sessionId === session.id).slice(-1)[0]?.text,
    updatedAt: session.updatedAt || session.createdAt,
    messageCount: messages.filter(m => m.sessionId === session.id).length,
  }));

  // RTK Query for fetching and sending
  const { isFetching, refetch: refetchMessages } = useGetSessionMessagesQuery(activeSessionId!, {
    skip: !activeSessionId,
    refetchOnMountOrArgChange: true,
  });

  console.log('📊 ChatWorkspace: Managing', messages.length, 'messages for session', activeSessionId);

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Messages are managed through RTK Query refetch and manual dispatch in handleSendMessage

  const handleSendMessage = async (text: string) => {
    let sessionId = activeSessionId;
    
    // Create session if none exists
    if (!sessionId) {
      sessionId = nanoid();
      dispatch(addSession({
        id: sessionId,
        title: 'New Chat',
        userId: 'me',
        status: 'active',
        messageIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      dispatch(setActiveSession(sessionId));
    }
    try {
      // Optimistically append user message to store for immediate UI feedback
      dispatch(addMessage({
        id: nanoid(),
        sessionId: sessionId,
        text,
        sender: 'user',
        timestamp: new Date().toISOString(),
        status: 'sent',
      }));
      await sendMessage({ sessionId: sessionId, text }).unwrap();
      
      // Refetch messages to get assistant response with progressive delays
      const refetchWithDelay = async () => {
        console.log('🔄 ChatWorkspace: Refetching messages for assistant response...');
        const result = await refetchMessages();
        if (result.data) {
          dispatch(setMessages(result.data));
          console.log('✅ ChatWorkspace: Updated store with', result.data.length, 'messages');
        }
      };
      
      // Progressive refetching: 500ms, 2s, 5s
      setTimeout(refetchWithDelay, 500);
      setTimeout(refetchWithDelay, 2000);
      setTimeout(refetchWithDelay, 5000);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };
  
  const handleNewSession = () => {
    const newSessionId = nanoid();
    dispatch(addSession({
      id: newSessionId,
      title: 'New Chat',
      userId: 'me',
      status: 'active',
      messageIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    dispatch(setActiveSession(newSessionId));
  };
  
  const handleSessionSelect = (sessionId: string) => {
    dispatch(setActiveSession(sessionId));
  };

  return (
    <Stack direction="row" sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sessions Sidebar */}
      <SessionsSidebar
        sessions={sessions}
        activeSessionId={activeSessionId || undefined}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        isLoading={isFetching}
      />
      
      {/* Main Chat Interface */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AgenticChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={isFetching || isSending}
          activeAgent={{
            id: 'general',
            name: 'General Assistant',
            avatar: '🤖',
            specialization: 'General purpose AI assistant',
            status: 'active',
            color: '#2196F3'
          }}
          availableAgents={[
            {
              id: 'general',
              name: 'General Assistant',
              avatar: '🤖',
              specialization: 'General purpose AI assistant',
              status: 'active',
              color: '#2196F3'
            }
          ]}
          onAgentSwitch={() => {}}
          placeholder="Ask the agent anything..."
        />
      </Box>
    </Stack>
  );
};

export default ChatWorkspace;
