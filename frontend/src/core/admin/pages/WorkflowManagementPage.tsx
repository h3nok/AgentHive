import React from 'react';
import { Box } from '@mui/material';
import EnhancedWorkflowAutomationHub from '../../workflows/EnhancedWorkflowAutomationHub';

const WorkflowManagementPage: React.FC = () => {
  return (
    <Box sx={{ p: 0 }}>
      {/* Workflow Automation Hub Component */}
      <EnhancedWorkflowAutomationHub />
    </Box>
  );
};

export default WorkflowManagementPage;
