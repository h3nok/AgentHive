import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { ChatInterface } from '@core/chat';
import { 
  selectMessagesBySessionId,
  createNewSession,
  setActiveSession
} from '@core/chat/chat/chatSlice';
import type { RootState } from '@/shared/store';

const ChatWorkspace: React.FC = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state: RootState) => state.chat.sessions);
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  
  // Get messages for the active session
  const messages = useSelector((state: RootState) => 
    activeSessionId ? selectMessagesBySessionId(activeSessionId)(state) : []
  );

  // Create initial session if none exists
  useEffect(() => {
    if (!activeSessionId) {
      if (sessions && sessions.length > 0) {
        // Set the first session as active if none is active
        dispatch(setActiveSession(sessions[0].id));
      } else {
        // Create a new session if none exists
        const newSessionId = `session-${Date.now()}`;
        dispatch(createNewSession(newSessionId));
        dispatch(setActiveSession(newSessionId));
      }
    }
  }, [activeSessionId, sessions, dispatch]);

  const handleSendMessage = async (message: string) => {
    if (!activeSessionId) return;
    
    try {
      // TODO: Implement message sending logic
      console.log('Sending message:', message);
      // await dispatch(sendMessage({ sessionId: activeSessionId, message }));
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
      isLoading={false}
      messages={messages}
      sessionId={activeSessionId}
    />
  );
};

export default ChatWorkspace;
