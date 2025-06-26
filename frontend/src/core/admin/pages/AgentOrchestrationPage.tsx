import React from 'react';
import { Box } from '@mui/material';
import AgentOrchestrationDashboard from '../../agents/AgentOrchestrationDashboard';

const AgentOrchestrationPage: React.FC = () => {
  return (
    <Box sx={{ p: 0 }}>
      {/* Agent Orchestration Dashboard Component */}
      <AgentOrchestrationDashboard />
    </Box>
  );
};

export default AgentOrchestrationPage;
