// MessageRow.tsx – ChatGPT-style row (now stacks avatar above bubble)
import React, { useRef, useState, useCallback } from 'react';
import { Box, Avatar, Typography, useTheme } from '@mui/material';
import MarkdownRenderer from './markdown/MarkdownRenderer';
import LoadingDots from './LoadingDots';
import CaretBlink from './CaretBlink';
import BubbleActions from './BubbleActions';
import { useCanvas } from '../context/CanvasContext';
import LogoText from './LogoText';

export interface MessageRowProps {
  msg: {
    id: string;
    text: string;
    sender: 'user' | 'assistant' | 'agent' | 'system';
    timestamp: string;
  };
  sameSender?: boolean;
  isStreaming?: boolean;
  avatarIcon?: React.ReactNode; // for assistant
}

const MessageRow: React.FC<MessageRowProps> = ({
  msg,
  sameSender = false,
  isStreaming = false,
  avatarIcon,
}) => {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const { openWithMessage } = useCanvas();

  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null);

  const handleCopy = useCallback(() => {
    if (navigator?.clipboard && msg.text) {
      navigator.clipboard.writeText(msg.text).catch(console.error);
    }
  }, [msg.text]);

  const handleOpenCanvas = useCallback(() => {
    openWithMessage({ ...msg, sender: msg.sender });
  }, [openWithMessage, msg]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setActionAnchor(e.currentTarget);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActionAnchor(null);
  }, []);

  const isUser = msg.sender === 'user';

  /* tail triangle coords */
  const tail = isUser
    ? {
        right: -6,
        borderLeft: '6px solid #C60C30',
        borderTop: '6px solid transparent',
      }
    : {
        left: -6,
        borderRight: `6px solid ${dark ? '#323232' : '#F7F8F9'}`,
        borderTop: '6px solid transparent',
      };

  /* format timestamp HH:MM */
  const ts = new Date(msg.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ------------------------------------------------------------
  // Streaming helpers – only show dots/caret while text is empty
  // ------------------------------------------------------------
  const showPlaceholder = isStreaming && (!msg.text || msg.text.trim().length === 0);

  return (
    <Box
      className={`msgRow ${isUser ? 'user' : 'assistant'} ${sameSender ? 'same' : ''}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',      // ← Stack avatar above bubble
        alignItems: isUser ? 'flex-end' : 'flex-start', // ← User right, assistant left
        alignSelf: isUser ? 'flex-end' : 'flex-start',  // ← Force alignment within parent
        width: '100%',
        maxWidth: {
          xs: '90%',  // Almost full width on mobile
          sm: '80%',  // Slightly narrower on small tablets
          md: '70%',  // Medium width on tablets
          lg: '60%',  // Max 60% on large screens
        },
        gap: 0.5,
        mt: sameSender ? 0.5 : 2,
        px: { xs: 1, sm: 2 },
      }}
    >
      {/* 1) Avatar on top */}
      <Avatar
        sx={{
          display: { xs: 'none', sm: 'flex' },
          bgcolor: 'transparent',
          width: 36,
          height: 36,
          fontSize: 16,
          fontWeight: 700,
          mb: 0.5,  // tiny space between avatar and bubble
        }}
        aria-label={isUser ? 'You' : 'Assistant'}
      >
        {isUser
          ? 'U'
          : avatarIcon ?? (
              <LogoText size="small" showOnlyBubble={true} animated={false} />
            )}
      </Avatar>

      {/* 2) Bubble + timestamp (stacked beneath avatar) */}
      <Box
        sx={{
          flexGrow: 0,
          flexBasis: 'auto',
          minWidth: 0,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <Box
          className={`bubble ${isUser ? 'user' : 'assistant'}`}
          sx={{
            position: 'relative',
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1.5, sm: 1.75 },
            borderRadius: '18px',
            fontSize: { xs: 14, sm: 15 },
            lineHeight: 1.6,
            width: '100%',
            maxWidth: '100%',
            wordBreak: 'break-word',
            bgcolor: isUser ? '#C60C30' : 'transparent',
            color: isUser ? '#fff' : dark ? '#ECECEC' : '#1F1F1F',
            boxShadow: isUser
              ? '0 4px 12px rgba(198, 12, 48, 0.12)'
              : '0 2px 6px rgba(0,0,0,0.05)',
            '&:hover': isUser
              ? {
                  boxShadow: '0 6px 16px rgba(198, 12, 48, 0.2)',
                  transform: 'translateY(-1px)',
                }
              : undefined,
            '&::after': isUser
              ? { content: '""', position: 'absolute', bottom: 8, ...tail }
              : undefined,
            overflowX: 'auto',
          }}
          ref={bubbleRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {showPlaceholder ? (
            <LoadingDots />
          ) : (
            <>
              {isUser ? (
                <Typography
                  variant="body1"
                  component="div"
                  sx={{
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}
                </Typography>
              ) : (
                <MarkdownRenderer markdown={msg.text} />
              )}
              {showPlaceholder && !isUser && <CaretBlink />}
            </>
          )}
        </Box>

        {/* timestamp (shows on hover) */}
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            px: 1,
            fontSize: 12,
            color: isUser
              ? 'rgba(255,255,255,.6)'
              : dark
              ? 'rgba(255,255,255,.5)'
              : 'rgba(0,0,0,.45)',
            opacity: 0,
            transition: 'opacity .2s',
            textAlign: isUser ? 'right' : 'left',
            '.msgRow:hover &': { opacity: 1 },
          }}
        >
          {ts}
        </Typography>

        {/* context / hover actions */}
        {actionAnchor && (
          <BubbleActions
            anchorEl={actionAnchor}
            onCopy={handleCopy}
            onOpenCanvas={!isUser ? handleOpenCanvas : undefined}
            isUser={isUser}
          />
        )}
      </Box>
    </Box>
  );
};

export default React.memo(MessageRow);
