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

  // Map TaskStatus to StatusBadge status
  const mapStatusToBadge = (taskStatus: typeof status): 'online' | 'offline' | 'connecting' => {
    switch (taskStatus) {
      case 'running':
        return 'connecting';
      case 'completed':
        return 'online';
      case 'error':
      case 'paused':
        return 'offline';
      default:
        return 'offline';
    }
  };

  // Transform TaskMessage to ChatMessage
  const transformedMessages = messages.map(msg => ({
    id: msg.id,
    text: msg.content,
    sender: msg.role === 'user' ? 'user' as const : 'assistant' as const,
    timestamp: msg.timestamp
  }));

  // Handlers for AgentCollaboration
  const handleWorkflowSelect = (workflow: any) => {
    console.log('Workflow selected:', workflow);
  };

  const handleAgentSelect = (agentId: string) => {
    console.log('Agent selected:', agentId);
  };

  return (
    <ChatErrorBoundary>
      <div className="flex flex-col h-full">
        <header className="p-2 flex items-center gap-2 border-b">
          <StatusBadge status={mapStatusToBadge(status)} />
        </header>

        <div className="flex-1 overflow-auto">
          <ChatMessageList messages={transformedMessages} />
        </div>

        <AgentCollaboration 
          onWorkflowSelect={handleWorkflowSelect}
          onAgentSelect={handleAgentSelect}
        />

        <div className="p-2 border-t flex items-center gap-2">
          <ChatInput onSendMessage={send} isLoading={status === 'running'} />
        </div>
      </div>
    </ChatErrorBoundary>
  );
};

export default TaskDetailsPage;
