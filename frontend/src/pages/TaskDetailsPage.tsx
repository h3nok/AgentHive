import React from 'react';
import { useParams } from 'react-router-dom';
import ChatMessageList from '@/components/ChatMessageList';
import ChatInput from '@/components/ChatInput';
import ChatRoutingIndicator from '@/components/ChatRoutingIndicator';
import MessageSkeleton from '@/components/MessageSkeleton';
import AgentCollaboration from '@/components/AgentCollaboration';
import ChatErrorBoundary from '@/components/ChatErrorBoundary';
import StatusBadge from '@/components/StatusBadge';
import VoiceBtn from '@/components/VoiceBtn';
import useTaskStream from '@/hooks/useTaskStream';

const TaskDetailsPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { messages, status, send } = useTaskStream(taskId!);

  return (
    <ChatErrorBoundary>
      <div className="flex flex-col h-full">
        <header className="p-2 flex items-center gap-2 border-b">
          <StatusBadge status={status} />
          <ChatRoutingIndicator taskId={taskId!} />
        </header>

        <div className="flex-1 overflow-auto">
          <ChatMessageList messages={messages} skeleton={<MessageSkeleton />} />
        </div>

        <AgentCollaboration taskId={taskId!} />

        <div className="p-2 border-t flex items-center gap-2">
          <ChatInput onSubmit={send} disabled={status !== 'running'} />
          <VoiceBtn onVoiceSubmit={send} />
        </div>
      </div>
    </ChatErrorBoundary>
  );
};

export default TaskDetailsPage;
