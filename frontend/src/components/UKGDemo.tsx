import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import type { ChatMessage as ChatMessageType } from '../features/chat/chatSlice';

interface UKGChatMessageProps {
  message: ChatMessageType;
  /** true while the assistant/system is still streaming the message */
  isStreaming?: boolean;
}

/**
 * Lightweight placeholder for UKG-style system / HR messages so the build can succeed.
 * Replace with the fully-featured implementation when available.
 */
export const UKGChatMessage: React.FC<UKGChatMessageProps> = ({ message, isStreaming = false }) => {
  return (
    <Box sx={{ my: 1, display: 'flex', justifyContent: 'center' }}>
      <Paper elevation={1} sx={{ p: 2, maxWidth: 600 }}>
        <Typography variant="overline" color="primary.main">
          {message.agent?.toUpperCase() || 'SYSTEM'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {message.text.trim().length > 0 ? message.text : isStreaming ? '…' : ''}
        </Typography>
      </Paper>
    </Box>
  );
};

export default UKGChatMessage;
