import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Message as ChatMessageType } from '../../shared/store/slices/entitiesSlice';

interface ChatMessageListProps {
  messages?: ChatMessageType[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages: externalMessages }) => {

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