import React from 'react';
import { useDispatch } from 'react-redux';
import VirtualizedMessageList from './VirtualizedMessageList';
import type { ChatMessage as ChatMessageType } from '../features/chat/chatSlice';

interface ChatMessageListProps {
  activeAgent?: string;
  messages?: ChatMessageType[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ activeAgent, messages: externalMessages }) => {
  const dispatch = useDispatch();

  const handleLoadMore = async () => {
    // TODO: Implement loading older messages
    // This is a placeholder for the actual implementation
    return new Promise<void>(resolve => setTimeout(resolve, 1000));
  };

  return (
    <VirtualizedMessageList
      activeAgent={activeAgent}
      messages={externalMessages}
      onLoadMore={handleLoadMore}
    />
  );
};

export default React.memo(ChatMessageList);