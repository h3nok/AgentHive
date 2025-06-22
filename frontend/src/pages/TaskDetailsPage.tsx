import React from 'react';
import { useParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ChatMessageList from '@/components/ChatMessageList';
import ChatInput from '@/components/EnterpriseInputBar';
import AgentCollaboration from '@/components/AgentCollaboration';
import ChatErrorBoundary from '@/components/ChatErrorBoundary';
import StatusBadge from '@/components/StatusBadge';
import useTaskStream from '@/hooks/useTaskStream';

const TaskDetailsPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { messages, status, send } = useTaskStream(taskId!);

  return (
    <ChatErrorBoundary>
      <div className="flex flex-col h-full">
        <header className="p-2 flex items-center gap-2 border-b">
          <StatusBadge status={status} />
        </header>

        <div className="flex-1 overflow-auto">
          <ChatMessageList 
            messages={messages} 
            skeleton={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            } 
          />
        </div>

        <AgentCollaboration />

        <div className="p-2 border-t flex items-center gap-2">
          <ChatInput onSendMessage={send} isLoading={status === 'running'} />
        </div>
      </div>
    </ChatErrorBoundary>
  );
};

export default TaskDetailsPage;
