import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Box, Paper, Typography } from '@mui/material';

// TODO // CLEANUP_DEV – Remove before production GA.

const ChatDebugOverlay: React.FC = () => {
  // if (import.meta.env.MODE !== 'development') return null; // TEMP: show in all modes for debugging

  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  const sessions = useSelector((state: RootState) => state.chat.sessions);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const msgCount = activeSession?.messages.length ?? 0;
  const title = activeSession?.title ?? 'Untitled';

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      <Paper
        component="pre"
        sx={{
          m: 0,
          p: 1.5,
          minWidth: 220,
          maxWidth: 260,
          fontSize: '0.75rem',
          lineHeight: 1.3,
          whiteSpace: 'pre-wrap',
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      >
        <Typography variant="caption" component="span" sx={{ fontWeight: 700 }}>
          Debug
        </Typography>
        {`\nSession: ${activeSessionId ?? '—'}\nTitle: ${title}\nMessages: ${msgCount}`}
      </Paper>
    </Box>
  );
};

export default ChatDebugOverlay; 