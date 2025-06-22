import React from 'react';
import FuturisticChatInterface from '../components/FuturisticChatInterface';

const ChatWorkspace: React.FC = () => {
  // For now we just render chat interface; session routing can be added later
  return (
    <FuturisticChatInterface
      onSendMessage={() => {}}
      isLoading={false}
    />
  );
};

export default ChatWorkspace;
