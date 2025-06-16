import React, { memo, useMemo, useCallback } from 'react';
import { Box, Typography, Skeleton, useTheme, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, selectTheme, selectConnectionStatus } from '../store';
import { ComponentErrorBoundary } from './ErrorBoundary';

interface LogoTextProps {
  size?: 'small' | 'medium' | 'large';
  showOnlyBubble?: boolean;
  hasNewMessage?: boolean;
  animated?: boolean;
  interactive?: boolean;
  useGif?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
}

interface SizeConfig {
  height: number;
  fontSize: string;
  spacing: number;
  logoSize: string;
}

// Size configurations with proper scaling
const SIZE_CONFIGS: Record<NonNullable<LogoTextProps['size']>, SizeConfig> = {
  small: {
    height: 36,
    fontSize: '1rem',
    spacing: 2,
    logoSize: '2rem',
  },
  medium: {
    height: 48,
    fontSize: '1.5rem',
    spacing: 3,
    logoSize: '2.5rem',
  },
  large: {
    height: 60,
    fontSize: '2rem',
    spacing: 4,
    logoSize: '3rem',
  },
} as const;

const LogoImage: React.FC<{
  height: number;
  logoSize: string;
  interactive: boolean;
  animated: boolean;
  hasNewMessage: boolean;
  connectionStatus: string;
  useGif?: boolean;
  showOnlyBubble?: boolean;  // added optional prop
}> = memo(({ height, logoSize, interactive, animated, hasNewMessage, connectionStatus, useGif = false, showOnlyBubble = false }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={animated ? { duration: 0.5, delay: 0.2 } : undefined}
      whileHover={interactive ? { scale: 1.05, rotate: 2 } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      style={hasNewMessage && animated ? { 
        animation: 'pulse 2s infinite ease-in-out' 
      } : undefined}
    >
      <Box 
        sx={{ 
          height, 
          width: height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          borderRadius: '50%',
          background: 'transparent',
          transition: 'all 0.3s ease',
          pl: 1,  // added left padding to avoid clipping
          '&:hover': interactive ? {
            background: `linear-gradient(135deg, rgba(255, 204, 0, 0.15), transparent)`,
            boxShadow: '0 0 15px rgba(255, 204, 0, 0.2)',
          } : undefined,
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
            '100%': { transform: 'scale(1)' },
          },
          '@keyframes hover': {
            '0%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-5px)' },
            '100%': { transform: 'translateY(0px)' },
          },
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: logoSize,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: `drop-shadow(0 4px 16px rgba(255, 204, 0, 0.5)) drop-shadow(0 2px 8px rgba(255, 165, 0, 0.3))`,
            animation: interactive 
              ? 'hover 6s infinite ease-in-out, enhancedBeeWingFlap 2.5s infinite ease-in-out, beeGlow 4s infinite ease-in-out' 
              : 'enhancedBeeWingFlap 2.5s infinite ease-in-out, beeGlow 4s infinite ease-in-out',
            transition: 'filter 0.3s ease, transform 0.3s ease',
            transform: 'scale(1.2)',
            position: 'relative',
            '&:hover': interactive ? {
              transform: 'scale(1.35) translateY(-2px)',
              filter: `drop-shadow(0 8px 24px rgba(255, 204, 0, 0.8)) drop-shadow(0 4px 12px rgba(255, 165, 0, 0.6)) drop-shadow(0 2px 6px rgba(255, 140, 0, 0.4))`,
              animation: 'enhancedBeeWingFlap 1.5s infinite ease-in-out, intenseBeeGlow 2s infinite ease-in-out',
            } : undefined,
            '&:before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 204, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 50%, transparent 70%)',
              animation: 'beeAura 3s infinite ease-in-out',
              zIndex: -1,
              pointerEvents: 'none',
            },
            '@keyframes enhancedBeeWingFlap': {
              '0%, 100%': { 
                transform: 'scale(1.2) rotateZ(0deg) translateY(0px)',
              },
              '15%': { 
                transform: 'scale(1.22) rotateZ(-1.5deg) translateY(-1px)',
              },
              '30%': { 
                transform: 'scale(1.18) rotateZ(0.5deg) translateY(-2px)',
              },
              '45%': { 
                transform: 'scale(1.25) rotateZ(1.5deg) translateY(-1px)',
              },
              '60%': { 
                transform: 'scale(1.16) rotateZ(-0.5deg) translateY(-2px)',
              },
              '75%': { 
                transform: 'scale(1.24) rotateZ(1deg) translateY(-1px)',
              },
              '90%': { 
                transform: 'scale(1.19) rotateZ(-0.8deg) translateY(-1px)',
              },
            },
            '@keyframes beeGlow': {
              '0%, 100%': { 
                filter: `drop-shadow(0 4px 16px rgba(255, 204, 0, 0.5)) drop-shadow(0 2px 8px rgba(255, 165, 0, 0.3))`,
              },
              '50%': { 
                filter: `drop-shadow(0 6px 20px rgba(255, 204, 0, 0.7)) drop-shadow(0 3px 12px rgba(255, 165, 0, 0.5)) drop-shadow(0 1px 4px rgba(255, 140, 0, 0.3))`,
              },
            },
            '@keyframes intenseBeeGlow': {
              '0%, 100%': { 
                filter: `drop-shadow(0 8px 24px rgba(255, 204, 0, 0.8)) drop-shadow(0 4px 12px rgba(255, 165, 0, 0.6)) drop-shadow(0 2px 6px rgba(255, 140, 0, 0.4))`,
              },
              '50%': { 
                filter: `drop-shadow(0 12px 32px rgba(255, 204, 0, 0.9)) drop-shadow(0 6px 16px rgba(255, 165, 0, 0.7)) drop-shadow(0 3px 8px rgba(255, 140, 0, 0.5))`,
              },
            },
            '@keyframes beeAura': {
              '0%, 100%': { 
                transform: 'translate(-50%, -50%) scale(0.8)',
                opacity: 0.3,
              },
              '50%': { 
                transform: 'translate(-50%, -50%) scale(1.2)',
                opacity: 0.1,
              },
            },
          }}
          aria-label="AgentHive Bee Logo"
        >
          🐝
        </Typography>
        
        {/* Single adaptive connection/new-message indicator */}
        <AnimatePresence>
          {!showOnlyBubble && (connectionStatus !== 'online' || hasNewMessage) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: hasNewMessage ? [1, 1.2, 1] : 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: hasNewMessage ? 1 : 0.3, repeat: hasNewMessage ? Infinity : 0 }}
              style={{
                position: 'absolute',
                bottom: hasNewMessage ? '50%' : '10%',
                right: '10%',
                width: height * 0.2,
                height: height * 0.2,
                borderRadius: '50%',
                backgroundColor: hasNewMessage
                  ? '#4caf50'
                  : connectionStatus === 'connecting'
                    ? '#ff9800'
                    : '#f44336',
                border: `2px solid ${theme.palette.background.paper}`,
                zIndex: 1,
              }}
            />
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
});

LogoImage.displayName = 'LogoImage';

const LogoTextContent: React.FC<LogoTextProps> = ({
  size = 'large',
  showOnlyBubble = false,
  hasNewMessage = false,
  animated = true,
  interactive = false,
  useGif = false,
  onClick,
  'aria-label': ariaLabel,
}) => {
  const theme = useTheme();
  const currentTheme = useAppSelector(selectTheme);
  const connectionStatus = useAppSelector(selectConnectionStatus);

  const config = SIZE_CONFIGS[size];
  
  // Memoized gradient based on theme
  const textGradient = useMemo(() => {
    const baseGradient = 'linear-gradient(90deg, #c8102e 0%, #5f5f5f 100%)';
    if (currentTheme === 'dark') {
      return 'linear-gradient(90deg, #e53e56 0%, #8e8e8e 100%)';
    }
    return baseGradient;
  }, [currentTheme]);

  // Memoized styles for performance
  const containerStyles = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: config.spacing * 0.3,
    cursor: interactive ? 'pointer' : 'default',
    userSelect: 'none' as const,
    flexDirection: 'row' as const,
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    '&:hover': interactive ? {
      transform: 'translateY(-2px) scale(1.02)',
      filter: 'drop-shadow(0 8px 24px rgba(255, 204, 0, 0.5))',
    } : undefined,
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 4,
      borderRadius: 2,
      transform: 'scale(1.05)',
    },
    '&:active': interactive ? {
      transform: 'translateY(0px) scale(0.98)',
      transition: 'all 0.1s ease',
    } : undefined,
  }), [config.spacing, interactive, theme.palette.primary.main]);

  const textStyles = useMemo(() => ({
    fontSize: config.fontSize,
    fontWeight: 600,
    letterSpacing: '-0.5px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    display: 'inline-block',
    lineHeight: 1.2,
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative',
    ...(interactive && {
      '&:hover': {
        filter: 'drop-shadow(0 0 8px rgba(255, 204, 0, 0.7))',
        transform: 'translateX(2px)',
      }
    }),
  }), [config.fontSize, textGradient, interactive]);

  const handleClick = useCallback(() => {
    if (interactive && onClick) {
      onClick();
    }
  }, [interactive, onClick]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.();
    }
  }, [interactive, onClick]);

  // Loading state
  if (!config) {
    return (
      <Skeleton 
        variant="rectangular" 
        width={200} 
        height={60}
        sx={{ borderRadius: 2 }}
      />
    );
  }

  const content = (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] } : undefined}
    >
      <Box
        sx={containerStyles}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive ? 0 : -1}
        role={interactive ? 'button' : undefined}
        aria-label={ariaLabel || (interactive ? 'AgentHive Logo - Click to interact' : 'AgentHive Logo')}
        component={motion.div}
        whileHover={interactive ? { scale: 1.02 } : undefined}
        whileTap={interactive ? { scale: 0.98 } : undefined}
      >
        {!showOnlyBubble && (
          <motion.div
            initial={animated ? { opacity: 0, x: -20 } : undefined}
            animate={animated ? { opacity: 1, x: 0 } : undefined}
            transition={animated ? { duration: 0.5, delay: 0.1 } : undefined}
          >
            <Typography 
              component="span"
              sx={textStyles}
              aria-hidden="true"
            >
              AgentHive
            </Typography>
          </motion.div>
        )}
        
        <LogoImage
          height={config.height}
          logoSize={config.logoSize}
          interactive={interactive}
          animated={animated}
          hasNewMessage={hasNewMessage}
          connectionStatus={connectionStatus}
          useGif={useGif}
          showOnlyBubble={showOnlyBubble}
        />
        
      </Box>
    </motion.div>
  );

  // Wrap with tooltip if interactive
  if (interactive) {
    return (
      <Tooltip 
        title="AgentHive AI Assistant"
        placement="bottom"
        arrow
      >
        {content}
      </Tooltip>
    );
  }

  return content;
};

// Main component with error boundary
export const LogoText: React.FC<LogoTextProps> = memo((props) => {
  return (
    <ComponentErrorBoundary componentName="LogoText">
      <LogoTextContent {...props} />
    </ComponentErrorBoundary>
  );
});

LogoText.displayName = 'LogoText';

export default LogoText;
