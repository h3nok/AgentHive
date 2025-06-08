import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Box, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useHexFlightPath, useViewportDimensions } from '../hooks/useHexFlightPath';
import LogoText from './LogoText';

interface AgentHiveFloatingWidgetProps {
  /** Flight speed multiplier (default: 1) */
  speed?: number;
  /** Duration to pause when showing message bubble (default: 4000ms) */
  pauseDuration?: number;
  /** Interval between messages (default: 25000ms) */
  messageInterval?: number;
  /** Array of helpful tips to display */
  messages?: string[];
  /** Size of the bee widget (default: 40) */
  size?: number;
  /** Callback when bee is clicked */
  onOpenChat?: () => void;
}

const DEFAULT_MESSAGES = [
  "💡 Try asking me about your team's schedule!",
  "🚀 I can help automate your workflows",
  "📊 Need help with reports? Just ask!",
  "⚡ Speed up approvals with AI assistance",
  "🔍 Search across all your enterprise tools",
  "🤖 Your AI swarm is ready to help!",
];

/**
 * Floating bee widget that flies around the viewport in a hexagonal pattern,
 * displays helpful tips, and opens chat when clicked.
 * Fully accessible and respects reduced motion preferences.
 */
const AgentHiveFloatingWidget: React.FC<AgentHiveFloatingWidgetProps> = ({
  speed = 1,
  pauseDuration = 4000,
  messageInterval = 25000,
  messages = DEFAULT_MESSAGES,
  size = 40,
  onOpenChat,
}) => {
  const theme = useTheme();
  const viewport = useViewportDimensions();
  const flightPath = useHexFlightPath(size, viewport);
  
  // Accessibility and motion preferences
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isTabletOrMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [isFlying, setIsFlying] = useState(!prefersReducedMotion);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Refs for cleanup
  const messageTimeoutRef = useRef<NodeJS.Timeout>();
  const bubbleTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Motion values for smooth animation
  const x = useMotionValue(flightPath.x[0] || 100);
  const y = useMotionValue(flightPath.y[0] || 100);
    // Calculate bubble position based on bee position
  const bubbleX = useTransform(x, (value) => value - 100);
  const bubbleY = useTransform(y, (value) => value - 80);

  // Transform for rotation based on movement direction
  const rotation = useTransform([x, y], ([currentX]) => {
    const prevX = x.getPrevious() || currentX;
    const deltaX = currentX - prevX;
    return deltaX * 0.1; // Subtle rotation based on horizontal movement
  });

  // Handle message cycling
  const showNextMessage = useCallback(() => {
    if (messages.length === 0) return;
    
    setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    setShowBubble(true);
    setIsFlying(false);
    
    // Hide bubble after pause duration
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
      setIsFlying(!prefersReducedMotion);
    }, pauseDuration);
  }, [messages.length, pauseDuration, prefersReducedMotion]);

  // Set up message interval
  useEffect(() => {
    if (prefersReducedMotion || isTabletOrMobile) return;
    
    messageTimeoutRef.current = setInterval(showNextMessage, messageInterval);
    
    return () => {
      if (messageTimeoutRef.current) {
        clearInterval(messageTimeoutRef.current);
      }
    };
  }, [showNextMessage, messageInterval, prefersReducedMotion, isTabletOrMobile]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearInterval(messageTimeoutRef.current);
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, []);

  // Handle click and keyboard interactions
  const handleActivate = useCallback(() => {
    if (onOpenChat) {
      onOpenChat();
    }
  }, [onOpenChat]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  }, [handleActivate]);

  // Pause motion on hover/focus
  const shouldPause = isHovered || isFocused || showBubble || prefersReducedMotion;

  // Animation variants
  const flightAnimation = {
    x: flightPath.x,
    y: flightPath.y,
  };

  const beeVariants = {
    flying: {
      ...flightAnimation,
      transition: {
        duration: 30 / speed,
        repeat: Infinity,
        ease: "linear",
      },
    },
    paused: {
      // Stay at current position
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
  };

  // Don't render on mobile/tablet for better UX
  if (isTabletOrMobile) {
    return null;
  }

  return (
    <>
      {/* Floating Bee */}
      <motion.div
        style={{
          position: 'fixed',
          zIndex: 1000,
          pointerEvents: 'auto',
          x,
          y,
          rotate: rotation,
        }}
        variants={beeVariants}
        animate={!shouldPause && isFlying ? "flying" : "paused"}
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <Box
          component="button"
          onClick={handleActivate}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Open AgentHive chat assistant"
          sx={{
            width: size,
            height: size,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '4px',
            },
            '&:hover': {
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            },
          }}
        >
          <LogoText
            size="small"
            showOnlyBubble
            animated={false}
            aria-hidden="true"
          />
        </Box>
      </motion.div>

      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && messages[currentMessageIndex] && (          <motion.div
            style={{
              position: 'fixed',
              zIndex: 1001,
              x: bubbleX,
              y: bubbleY,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Paper
              elevation={8}
              sx={{
                position: 'relative',
                maxWidth: 200,
                padding: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? '#35261A' 
                  : theme.palette.background.paper,
                border: `2px solid ${theme.palette.mode === 'dark' 
                  ? theme.palette.secondary.main 
                  : '#CE9A6A'}`,
                boxShadow: theme.shadows[8],
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: `8px solid ${theme.palette.mode === 'dark' 
                    ? theme.palette.secondary.main 
                    : '#CE9A6A'}`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${theme.palette.mode === 'dark' 
                    ? '#35261A' 
                    : theme.palette.background.paper}`,
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                  color: theme.palette.text.primary,
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                {messages[currentMessageIndex]}
              </Typography>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(AgentHiveFloatingWidget);
