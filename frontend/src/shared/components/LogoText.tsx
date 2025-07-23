import React, { memo, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Skeleton, useTheme, Tooltip } from '@mui/material';
import { useAppSelector } from '../store';
import { selectTheme } from '../store/slices/uiSlice';
import { selectOnlineStatus } from '../store/slices/connectionSlice';
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
  showOnlyBubble?: boolean;
}> = memo(({ height, logoSize, interactive, animated, hasNewMessage, connectionStatus, useGif = false, showOnlyBubble = false }) => {
  const theme = useTheme();

  return (
    <div>
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
          pl: 1,
          '&:hover': interactive ? {
            background: `linear-gradient(135deg, rgba(255, 204, 0, 0.15), transparent)`,
            boxShadow: '0 0 15px rgba(255, 204, 0, 0.2)',
          } : undefined,
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
            transform: 'scale(1.2)',
            position: 'relative',
            '&:hover': interactive ? {
              transform: 'scale(1.35) translateY(-2px)',
              filter: `drop-shadow(0 8px 24px rgba(255, 204, 0, 0.8)) drop-shadow(0 4px 12px rgba(255, 165, 0, 0.6)) drop-shadow(0 2px 6px rgba(255, 140, 0, 0.4))`,
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
              zIndex: -1,
              pointerEvents: 'none',
            },
          }}
          aria-label="AgentHive Bee Logo"
        >
          🐝
        </Typography>
      </Box>
    </div>
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
  const connectionStatus = useAppSelector(selectOnlineStatus);

  const config = SIZE_CONFIGS[size];
  
  // Add Poppins font to document head if not already added
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('poppins-font')) {
      const link = document.createElement('link');
      link.id = 'poppins-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

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
    } : undefined,
  }), [config.spacing, interactive, theme.palette.primary.main]);

  const textStyles = useMemo(() => ({
    fontSize: config.fontSize,
    fontWeight: 900,
    letterSpacing: '-1px',
    fontFamily: '"Poppins", "Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
    background: currentTheme === 'dark' 
      ? 'linear-gradient(135deg, #FFD700 0%, #FF8A00 50%, #FF6B00 100%)' 
      : 'linear-gradient(135deg, #FF8A00 0%, #E65100 100%)',
    textShadow: currentTheme === 'dark'
      ? '0 2px 8px rgba(255, 167, 38, 0.3), 0 4px 16px rgba(255, 152, 0, 0.2)'
      : '0 2px 4px rgba(0,0,0,0.1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    position: 'relative',
    padding: '0.4em 0.6em',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 0L100 30v40L50 100 0 70V30L50 0z\' fill=\'none\' stroke=\'%23' + (currentTheme === 'dark' ? 'ffc107' : 'ff9800') + '\' stroke-width=\'0.5\' opacity=\'0.2\' /%3E%3C/svg%3E")',
      backgroundSize: '40px 40px',
      opacity: 0.5,
      zIndex: -1,
      borderRadius: 'inherit',
    },
    '&:after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '150%',
      height: '150%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
      transform: 'translate(-50%, -50%)',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: -1,
    },
    ...(interactive && {
      '&:hover': {
        transform: 'translateY(-2px) scale(1.03)',
        filter: 'drop-shadow(0 12px 20px rgba(255, 140, 0, 0.5))',
        '&:before': {
          opacity: 0.7,
          transform: 'scale(1.1)',
          transition: 'all 0.6s ease',
        },
        '&:after': {
          opacity: 0.4,
        },
        '& .honeycomb-pattern': {
          transform: 'translateY(0) scale(1.1)',
          opacity: 0.3,
        }
      },
      '&:active': {
        transform: 'translateY(1px) scale(0.98)',
        filter: 'drop-shadow(0 2px 4px rgba(255, 140, 0, 0.3))',
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.warning.main}`,
        outlineOffset: '3px',
        borderRadius: '4px',
      }
    }),
  }), [config.fontSize, currentTheme, interactive]);

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
    <div>
      <Box
        sx={containerStyles}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive ? 0 : -1}
        role={interactive ? 'button' : undefined}
        aria-label={ariaLabel || (interactive ? 'AgentHive Logo - Click to interact' : 'AgentHive Logo')}
      >
        {!showOnlyBubble && (
          <div>
            <Typography 
              component="span"
              sx={textStyles}
              aria-hidden="true"
            >
              AgentHive
            </Typography>
          </div>
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
    </div>
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
