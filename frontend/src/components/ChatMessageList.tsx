import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, Typography } from '@mui/material';
import type { ChatMessage as ChatMessageType } from '../features/chat/chatSlice';

interface ChatMessageListProps {
  activeAgent?: string;
  messages?: ChatMessageType[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ activeAgent, messages: externalMessages }) => {
  const dispatch = useDispatch();

  const handleLoadMore = async () => {
    // TODO: Implement loading older messages
    // This is a placeholder for the actual implementation
    return new Promise<void>(resolve => setTimeout(resolve, 1000));
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 1 }}>
      {externalMessages?.map((message, index) => (
        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {message.sender || 'User'}
          </Typography>
          <Typography variant="body1">
            {message.text || 'No content'}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default React.memo(ChatMessageList);