/**
 * Agentic UI Page
 * 
 * Dedicated page for the new enterprise agentic interface.
 * This can be accessed via routing or as a standalone component.
 */

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import AgenticUIEntry from '../features/agentic-ui/AgenticUIEntry';

const AgenticUIPage: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <AgenticUIEntry
        initialMode="conversational"
        enableFullscreen={true}
        onStateChange={(state) => {
          // Could integrate with analytics, logging, etc.
          console.log('Agentic UI state updated:', state);
        }}
      />
    </Box>
  );
};

export default AgenticUIPage;
