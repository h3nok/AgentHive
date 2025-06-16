import React, { useRef, useEffect, useCallback, useState } from 'react';
import { VariableSizeList as List, ListOnScrollProps } from 'react-window';
import { Box, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ChatMessage from './ChatMessage';
import IntelligentRoutingIndicator from './IntelligentRoutingIndicator';
import type { ChatMessage as ChatMessageType } from '../features/chat/chatSlice';
import '../css/chatThread.css';
import '../css/scrollbar.css';

interface VirtualizedMessageListProps {
  activeAgent?: string;
  messages?: ChatMessageType[];
  onLoadMore?: () => Promise<void>;
}

const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  activeAgent,
  messages: externalMessages,
  onLoadMore,
}) => {
  const listRef = useRef<List>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Get messages from Redux store or use external messages
  const chatState = useSelector((state: RootState) => ({
    activeSessionId: state.chat.activeSessionId,
    sessions: state.chat.sessions,
    isLoading: state.chat.isLoading,
    currentAssistantMessageId: state.chat.currentAssistantMessageId,
    routingMetadata: state.chat.routingMetadata,
  }));

  const { activeSessionId, sessions, isLoading, currentAssistantMessageId, routingMetadata } = chatState;

  // Derive messages
  const messages = externalMessages || sessions.find(s => s.id === activeSessionId)?.messages || [];

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  // Handle loading more messages
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: ListOnScrollProps) => {
    if (scrollOffset < 100 && !loadingOlder && onLoadMore) {
      setLoadingOlder(true);
      onLoadMore().finally(() => setLoadingOlder(false));
    }
  }, [loadingOlder, onLoadMore]);

  // Estimate message height
  const getItemSize = useCallback((index: number) => {
    const message = messages[index];
    // Basic height estimation based on content length
    const baseHeight = 80;
    const contentLength = message.text.length;
    const additionalHeight = Math.floor(contentLength / 100) * 20;
    return Math.max(baseHeight, baseHeight + additionalHeight);
  }, [messages]);

  // Render individual message
  const MessageRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    const isStreaming = isLoading && currentAssistantMessageId === message.id;
    const messageAgent = message.agent || activeAgent;

    return (
      <div style={style}>
        <ChatMessage
          message={message}
          isStreaming={isStreaming}
          activeAgent={messageAgent}
        />
      </div>
    );
  }, [messages, isLoading, currentAssistantMessageId, activeAgent]);

  return (
    <Box
      ref={containerRef}
      className="thread"
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        alignItems: 'stretch',
      }}
    >
      {/* Loading indicator */}
      {loadingOlder && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {/* Routing indicator */}
      {routingMetadata && <IntelligentRoutingIndicator />}

      {/* Virtualized message list */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <List
          ref={listRef}
          height={dimensions.height}
          width={dimensions.width}
          itemCount={messages.length}
          itemSize={getItemSize}
          onScroll={handleScroll}
          overscanCount={5}
          className="chat-messages"
        >
          {MessageRow}
        </List>
      )}
    </Box>
  );
};

export default React.memo(VirtualizedMessageList); 