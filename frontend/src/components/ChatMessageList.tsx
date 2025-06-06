import React, { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { Box, useTheme, CircularProgress } from '@mui/material';
import ChatMessage from './ChatMessage';
import IntelligentRoutingIndicator from './IntelligentRoutingIndicator';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import type { ChatMessage as ChatMessageType } from '../features/chat/chatSlice';
import '../css/chatThread.css';
import '../css/scrollbar.css';

interface ChatMessageListProps {
  activeAgent?: string;
  messages?: ChatMessageType[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ activeAgent, messages: externalMessages }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  /* ─────────────────────────────────────────────────────────────
   * Refs & local state
   * ───────────────────────────────────────────────────────────*/
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null); // bottom sentinel
  const isAtBottomRef = useRef(true); // tracks if user is scrolled to bottom
  const [loadingOlder, setLoadingOlder] = useState(false);

  /* ─────────────────────────────────────────────────────────────
   * Selectors (memoised)
   * ───────────────────────────────────────────────────────────*/
  const chatState = useSelector(
    (state: RootState) => ({
      activeSessionId: state.chat.activeSessionId,
      sessions: state.chat.sessions,
      isLoading: state.chat.isLoading,
      currentAssistantMessageId: state.chat.currentAssistantMessageId,
      routingMetadata: state.chat.routingMetadata,
    }),
    (a, b) => (
      a.activeSessionId === b.activeSessionId &&
      a.sessions === b.sessions && // compare by reference instead of length
      a.isLoading === b.isLoading &&
      a.currentAssistantMessageId === b.currentAssistantMessageId &&
      a.routingMetadata === b.routingMetadata
    )
  );

  const { activeSessionId, sessions, isLoading, currentAssistantMessageId, routingMetadata } = chatState;

  // Derive messages (external override if provided)
  const messages = useMemo(() => {
    if (externalMessages) return externalMessages;
    const s = sessions.find((sess) => sess.id === activeSessionId);
    return s?.messages ?? [];
  }, [externalMessages, sessions, activeSessionId]);

  /* ─────────────────────────────────────────────────────────────
   * Helpers
   * ───────────────────────────────────────────────────────────*/
  const scrollToBottom = useCallback((smooth = true) => {
    if (sentinelRef.current) {
      // Defer the scroll until after layout has settled to ensure spacer is rendered
      requestAnimationFrame(() => {
        sentinelRef.current?.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end', // align with bottom of container
          inline: 'nearest',
        });
      });
    }
  }, []);

  const INPUT_VAR = Number(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--input-h')
      .replace('px', '')
  ) || 72; // fallback matches default --input-h

  // Helper to determine if sentinel is visible via IntersectionObserver
  const isNearBottom = () => {
    return isAtBottomRef.current;
  };

  /* ─────────────────────────────────────────────────────────────
   * Auto-scroll on new messages
   * ───────────────────────────────────────────────────────────*/
  const prevMsgCount = useRef<number>(messages.length);
  useEffect(() => {
    if (messages.length !== prevMsgCount.current) {
      if (isAtBottomRef.current) {
        // Ensure scroll happens on next animation frame after DOM updates
        requestAnimationFrame(() => {
          scrollToBottom(messages.length > prevMsgCount.current); // smooth only on append
        });
      }
      prevMsgCount.current = messages.length;
    }
  }, [messages, scrollToBottom]);

  /* ─────────────────────────────────────────────────────────────
   * IntersectionObserver to track sentinel visibility
   * ───────────────────────────────────────────────────────────*/
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const sentinelEl = sentinelRef.current;
    if (!scrollEl || !sentinelEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isAtBottomRef.current = entry.isIntersecting;
      },
      {
        root: scrollEl,
        threshold: 0.99, // consider visible when almost fully in view
      }
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, []);

  /* ─────────────────────────────────────────────────────────────
   * Scroll to bottom when session changes
   * ───────────────────────────────────────────────────────────*/
  useEffect(() => {
    scrollToBottom(false);
  }, [activeSessionId, scrollToBottom]);

  /* ─────────────────────────────────────────────────────────────
   * Infinite scroll – load older messages
   * ───────────────────────────────────────────────────────────*/
  const dispatch = useDispatch();
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingOlder) return;
    if (el.scrollTop < 20 && messages.length > 0) {
      // Placeholder: dispatch your real thunk here
      if (!activeSessionId) return;
      setLoadingOlder(true);
      const prevHeight = el.scrollHeight;
      // dispatch(fetchOlderMessages(activeSessionId))
      // Fake timeout to simulate network
      setTimeout(() => {
        // After messages are prepended, adjust scrollTop to preserve view
        requestAnimationFrame(() => {
          const diff = el.scrollHeight - prevHeight;
          el.scrollTop = diff + 20;
          setLoadingOlder(false);
        });
      }, 800);
    }
  }, [loadingOlder, messages.length, activeSessionId]);

  /* ─────────────────────────────────────────────────────────────
   * Render
   * ───────────────────────────────────────────────────────────*/
  return (
    <Box className="thread" sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', alignItems: 'stretch' }}>
      {/* Scrollable message column */}
      <Box
        className="chat-messages"
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          height: '100%',
          pl: { xs: 2, sm: '88px' },
          pr: { xs: 2, sm: 3 },
          pt: { xs: '64px', sm: '64px' },
          pb: `calc(var(--input-h) + 16px)`,
          scrollPaddingTop: '64px',
          scrollPaddingBottom: `calc(var(--input-h) + 16px)`,
          WebkitOverflowScrolling: 'touch',
          // Hide scrollbar for all browsers
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          'scrollbarWidth': 'none', // Firefox
          '-ms-overflow-style': 'none', // IE/Edge
        }}
      >
        {/* Load-older spinner */}
        {loadingOlder && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}

        {/* Intelligent routing indicator at top of list */}
        {routingMetadata && <IntelligentRoutingIndicator />}

        {/* Messages */}
        {messages.map((message, idx) => {
          const isStreaming = isLoading && currentAssistantMessageId === message.id;
          // Determine agent for this message: use message.agent if specified, otherwise fallback to selected agent
          const messageAgent = message.agent || activeAgent;
          return (
            <ChatMessage key={message.id || idx} message={message} isStreaming={isStreaming} activeAgent={messageAgent} />
          );
        })}

        {/* Spacer with extra blank area */}
        <Box sx={{ height: `calc(var(--input-h) + 96px)` }} />
        <div ref={sentinelRef} />
      </Box>
    </Box>
  );
};

export default React.memo(ChatMessageList);