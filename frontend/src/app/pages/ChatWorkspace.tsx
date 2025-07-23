import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ChatInterface } from '@core/chat';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { 
  selectAllSessions,
  selectActiveSession,
  setActiveSession,
  addMessage,
  addSession,
  selectMessagesBySession,
  setMessages
} from '@/shared/store/slices/entitiesSlice';
import {
  useGetSessionMessagesQuery,
  useSendMessageMutation,
} from '@/shared/store/api/apiSlice';
import { nanoid } from '@reduxjs/toolkit';

const ChatWorkspace: React.FC = () => {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectAllSessions);
  const activeSession = useAppSelector(selectActiveSession);
  const activeSessionId = activeSession?.id;
  
  // Ensure a session exists and is active before allowing message send
  useEffect(() => {
    if (!activeSessionId || !sessions.find(s => s.id === activeSessionId)) {
      const newSessionId = `session-${Date.now()}`;
      // Note: createSession action needs to be implemented in entitiesSlice
      dispatch(setActiveSession(newSessionId));
    }
  }, [activeSessionId, sessions, dispatch]);

  // Fetch messages via RTK Query and sync to store
  const { data: apiMessages = [], isFetching } = useGetSessionMessagesQuery(activeSessionId!, {
    skip: !activeSessionId,
  });

  useEffect(() => {
    if (apiMessages.length) {
      dispatch(setMessages(apiMessages));
    }
  }, [apiMessages, dispatch]);

  const messages = useAppSelector(state =>
    activeSessionId ? selectMessagesBySession(state as any, activeSessionId) : []
  );

  const [sendMessage] = useSendMessageMutation();

  const handleSendMessage = async (message: string) => {
  let sid = activeSessionId;
  // If no session yet, create one on the fly
  if (!sid) {
    sid = nanoid();
    dispatch(addSession({
      id: sid,
      title: 'New Chat',
      userId: 'me',
      status: 'active',
      messageIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    dispatch(setActiveSession(sid));
  }
    // Only allow sending if a valid session exists
    if (!activeSessionId || !sessions.find(s => s.id === activeSessionId)) return;
    try {
      dispatch(addMessage({
        id: nanoid(),
        sessionId: sid,
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString(),
        status: 'sent',
      }));
      await sendMessage({ sessionId: sid, text: message }).unwrap();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!activeSessionId) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ChatInterface
      onSendMessage={handleSendMessage}
      isLoading={isFetching}
      messages={messages}
      sessionId={activeSessionId}
    />
  );
};

export default ChatWorkspace;
