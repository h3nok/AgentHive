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
    height: 48,
    fontSize: '1.2rem',
    spacing: 2,
    logoSize: '85%',
  },
  medium: {
    height: 80,
    fontSize: '1.8rem',
    spacing: 3,
    logoSize: '85%',
  },
  large: {
    height: 120,
    fontSize: '2.5rem',
    spacing: 4,
    logoSize: '85%',
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

  // Determine which image to use
  const logoSrc = useGif ? '/AutoPilotLogo.gif' : '/AutoPilotLogo.png';

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
            background: `linear-gradient(135deg, ${theme.palette.primary.main}10, transparent)`,
          } : undefined,
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
            '100%': { transform: 'scale(1)' },
          },
        }}
      >
        <img
          src={logoSrc}
          alt="AutoTractor Logo"
          style={{ 
            height: logoSize, 
            width: logoSize, 
            objectFit: 'contain', 
            display: 'block',
            filter: useGif 
              ? `drop-shadow(0 4px 16px ${theme.palette.primary.main}30) brightness(1.2) contrast(1.2) saturate(1.1)`
              : `drop-shadow(0 4px 16px ${theme.palette.primary.main}30)`,
            transition: 'filter 0.3s ease',
            backgroundColor: 'transparent',
            borderRadius: useGif ? '50%' : '0',
            padding: useGif ? '12px' : '0',
            transform: useGif ? 'scale(1.5)' : 'scale(1)',
            mixBlendMode: useGif && theme.palette.mode === 'dark' ? 'screen' : 'normal',
            // For GIFs with black backgrounds, use a combination of filters to make it transparent-looking
            ...(useGif && {
              WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 100%)',
              maskImage: 'radial-gradient(circle, black 60%, transparent 100%)',
              backdropFilter: 'blur(1px)',
            })
          }}
          loading="lazy"
          onError={(e) => {
            console.warn('Logo image failed to load');
            e.currentTarget.style.display = 'none';
          }}
        />
        
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
      filter: 'drop-shadow(0 8px 24px rgba(200, 16, 46, 0.3))',
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
    background: textGradient,
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
        filter: 'drop-shadow(0 0 8px rgba(200, 16, 46, 0.4))',
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
        aria-label={ariaLabel || (interactive ? 'AutoTractor Logo - Click to interact' : 'AutoTractor Logo')}
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
              AutoTractor
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
        title="Tractor Supply AutoTractor AI Assistant"
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
