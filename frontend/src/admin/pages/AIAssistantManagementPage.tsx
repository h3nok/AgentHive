import React from 'react';
import { Box, Paper } from '@mui/material';
import FuturisticChatInterface from '../../components/FuturisticChatInterface';

const AIAssistantManagementPage: React.FC = () => {
  const handleSendMessage = (message: string, agent?: string, workflow?: string) => {
    console.log('Admin AI Assistant Message:', { message, agent, workflow });
  };

  const handleWorkflowTrigger = (workflowId: string, params?: any) => {
    console.log('Admin Workflow Trigger:', { workflowId, params });
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* AI Assistant Interface for Admin */}
      <Paper 
        sx={{ 
          height: 'calc(100vh - 200px)', 
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <FuturisticChatInterface
          onSendMessage={handleSendMessage}
          onWorkflowTrigger={handleWorkflowTrigger}
          enterpriseMode={true}
          activeWorkflows={23}
          onNavigateToWorkflows={() => window.location.href = '/admin/workflows'}
          onNavigateToAgents={() => window.location.href = '/admin/swarm'}
          currentAgent={{
            id: 'admin-assistant',
            name: 'Admin AI Assistant',
            status: 'ready' as const
          }}
        />
      </Paper>
    </Box>
  );
};

export default AIAssistantManagementPage;
