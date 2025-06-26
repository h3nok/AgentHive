import React from 'react';
import { ChatInterface } from '@core/chat';

const ChatWorkspace: React.FC = () => {
  // For now we just render chat interface; session routing can be added later
  return (
    <ChatInterface
      onSendMessage={() => {}}
      isLoading={false}
    />
  );
};

export default ChatWorkspace;
