import React from 'react';
import EnhancedChatInterfaceIntegrated from '../components/EnhancedChatInterfaceIntegrated';

const ChatWorkspace: React.FC = () => {
  // For now we just render chat interface; session routing can be added later
  return (
    <EnhancedChatInterfaceIntegrated
      onSendMessage={() => {}}
      isLoading={false}
    />
  );
};

export default ChatWorkspace;
