import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { useDispatch } from 'react-redux';
import { addMessage } from '../features/chat/chatSlice';
import { workflowService } from '../services/workflowService';
import WorkflowRenderer from './WorkflowRenderer';
import AgentDrivenChatInput from './AgentDrivenChatInput';

interface WorkflowStep {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  data?: any;
}

interface ChatInterfaceProps {
  onSendMessage: (text: string, agent: string) => void;
  isLoading: boolean;
  onStopRequest?: () => void;
  initialAgent?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  isLoading: parentIsLoading,
  onStopRequest,
  initialAgent,
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [workflowSummary, setWorkflowSummary] = useState<any>(null);

  const handleSendMessage = useCallback(async (text: string, agent: string) => {
    if (!text.trim()) return;

    // Add user message to chat
    dispatch(addMessage({
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
    }));

    setIsLoading(true);

    try {
      // Check if this is a workflow-related message
      if (text.toLowerCase().includes('time off') || text.toLowerCase().includes('pto')) {
        const workflowId = 'ukg_time_off';
        const steps: WorkflowStep[] = [
          { id: '1', type: 'Extracting Parameters', status: 'running' },
          { id: '2', type: 'Checking Balance', status: 'pending' },
          { id: '3', type: 'Submitting Request', status: 'pending' },
          { id: '4', type: 'Notifying Manager', status: 'pending' },
        ];
        setWorkflowSteps(steps);

        // Execute workflow
        const result = await workflowService.executeWorkflow(workflowId, {
          user_input: text,
          session: { /* Add any session data */ },
        });

        // Update steps with results
        setWorkflowSteps([
          { id: '1', type: 'Extracting Parameters', status: 'completed', message: 'Parameters extracted successfully' },
          { id: '2', type: 'Checking Balance', status: 'completed', message: 'Balance verified' },
          { id: '3', type: 'Submitting Request', status: 'completed', message: 'Request submitted' },
          { id: '4', type: 'Notifying Manager', status: 'completed', message: 'Manager notified' },
        ]);

        setWorkflowSummary(result);
      } else {
        // Handle regular chat messages
        onSendMessage(text, agent);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      dispatch(addMessage({
        id: Date.now().toString(),
        text: 'Sorry, there was an error processing your request.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      }));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, onSendMessage]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {workflowSteps.length > 0 && (
          <WorkflowRenderer
            steps={workflowSteps}
            summary={workflowSummary}
          />
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <AgentDrivenChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading || parentIsLoading}
          onStopRequest={onStopRequest}
          activeAgent={initialAgent}
        />
      </Box>
    </Box>
  );
};

export default ChatInterface;