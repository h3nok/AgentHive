import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { ChatInterface } from '@core/chat';
import { 
  selectMessagesBySessionId,
  createNewSession,
  setActiveSession,
  addMessage
} from '@core/chat/chat/chatSlice';
import type { RootState } from '@/shared/store';

const ChatWorkspace: React.FC = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state: RootState) => state.chat.sessions);
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  
  // Ensure a session exists and is active before allowing message send
  useEffect(() => {
    if (!activeSessionId || !sessions.find(s => s.id === activeSessionId)) {
      const newSessionId = `session-${Date.now()}`;
      dispatch(createNewSession(newSessionId));
      dispatch(setActiveSession(newSessionId));
    }
  }, [activeSessionId, sessions, dispatch]);

  // Get messages for the active session
  const messages = useSelector((state: RootState) => 
    activeSessionId ? selectMessagesBySessionId(activeSessionId)(state) : []
  );

  const handleSendMessage = async (message: string) => {
    // Only allow sending if a valid session exists
    if (!activeSessionId || !sessions.find(s => s.id === activeSessionId)) return;
    try {
      dispatch(addMessage({
        id: `user-${Date.now()}`,
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString(),
        agent: 'general',
      }));
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
