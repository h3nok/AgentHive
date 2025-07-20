import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AgentHubShell from '../agentHub/AgentHubShell';

const AgentManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Agent Management
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Monitor, configure, and manage your AI agents
      </Typography>
      
      <Paper sx={{ p: 0, borderRadius: 2 }}>
        <AgentHubShell />
      </Paper>
    </Box>
  );
};

export default AgentManagement;
