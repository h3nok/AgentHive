import React from 'react';
import { Box, Typography, useTheme, alpha, keyframes } from '@mui/material';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'connecting';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

// Softer, more visible pulse animation
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Ring pulse for online status
const ringPulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
`;

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status = 'online', 
  size = 'medium',
  showLabel = false 
}) => {
  const theme = useTheme();

  const sizeConfig = {
    small: { dotSize: 8, fontSize: '0.625rem', padding: '4px 8px' },
    medium: { dotSize: 10, fontSize: '0.75rem', padding: '5px 10px' },
    large: { dotSize: 12, fontSize: '0.875rem', padding: '6px 12px' }
  };

  const statusConfig = {
    online: {
      color: '#4caf50',
      bg: alpha('#4caf50', 0.12),
      label: 'Live',
      borderColor: alpha('#4caf50', 0.3),
    },
    connecting: {
      color: '#ff9800',
      bg: alpha('#ff9800', 0.12),
      label: 'Connecting',
      borderColor: alpha('#ff9800', 0.3),
    },
    offline: {
      color: '#f44336',
      bg: alpha('#f44336', 0.12),
      label: 'Offline',
      borderColor: alpha('#f44336', 0.3),
    }
  };

  const config = statusConfig[status];
  const dimensions = sizeConfig[size];

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: showLabel ? dimensions.padding.split(' ')[1] : 0,
        py: showLabel ? dimensions.padding.split(' ')[0] : 0,
        borderRadius: showLabel ? '16px' : '50%',
        backgroundColor: showLabel ? config.bg : 'transparent',
        border: showLabel ? `1px solid ${config.borderColor}` : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      }}
    >
      {/* Status dot with enhanced visibility */}
      <Box
        sx={{
          position: 'relative',
          width: dimensions.dotSize,
          height: dimensions.dotSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Main dot */}
        <Box
          sx={{
            width: dimensions.dotSize,
            height: dimensions.dotSize,
            borderRadius: '50%',
            backgroundColor: config.color,
            boxShadow: `0 0 ${dimensions.dotSize/2}px ${alpha(config.color, 0.5)}`,
            animation: status !== 'offline' ? `${pulse} 2s ease-in-out infinite` : 'none',
            position: 'relative',
            zIndex: 2,
          }}
        />
        
        {/* Pulsing ring for online status */}
        {status === 'online' && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: dimensions.dotSize,
              height: dimensions.dotSize,
              borderRadius: '50%',
              border: `2px solid ${config.color}`,
              transform: 'translate(-50%, -50%)',
              animation: `${ringPulse} 2s ease-out infinite`,
              zIndex: 1,
            }}
          />
        )}
      </Box>
      
      {/* Label */}
      {showLabel && (
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.mode === 'dark' ? config.color : theme.palette.text.primary,
            fontWeight: 600,
            fontSize: dimensions.fontSize,
            letterSpacing: '0.5px',
            lineHeight: 1,
          }}
        >
          {config.label}
        </Typography>
      )}
    </Box>
  );
};

export default StatusBadge; 