import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  alpha,
  keyframes
} from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circular' | 'linear' | 'thinking' | 'typing';
  showIcon?: boolean;
}

// Keyframes for thinking animation
const thinkingAnimation = keyframes`
  0%, 60%, 100% {
    transform: initial;
  }
  30% {
    transform: translateY(-10px);
  }
`;

const typingAnimation = keyframes`
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
`;

const ThinkingDots: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
            animation: `${thinkingAnimation} 1.4s infinite ease-in-out`,
            animationDelay: `${index * 0.16}s`
          }}
        />
      ))}
    </Box>
  );
};

const TypingDots: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
        AI is typing
      </Typography>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            bgcolor: theme.palette.text.secondary,
            animation: `${typingAnimation} 1.4s infinite`,
            animationDelay: `${index * 0.2}s`
          }}
        />
      ))}
    </Box>
  );
};

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium',
  variant = 'circular',
  showIcon = false
}) => {
  const theme = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 64;
      default: return 40;
    }
  };

  const renderContent = () => {
    switch (variant) {
      case 'thinking':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {showIcon && (
              <BotIcon 
                sx={{ 
                  fontSize: getSize(), 
                  color: theme.palette.primary.main,
                  animation: `${thinkingAnimation} 2s infinite`
                }} 
              />
            )}
            <ThinkingDots />
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Box>
        );
      
      case 'typing':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <TypingDots />
          </Box>
        );
      
      case 'linear':
        return (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '30%',
                  bgcolor: theme.palette.primary.main,
                  borderRadius: 2,
                  animation: 'loading-slide 2s infinite',
                  '@keyframes loading-slide': {
                    '0%': { left: '-30%' },
                    '50%': { left: '100%' },
                    '100%': { left: '-30%' }
                  }
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {message}
            </Typography>
          </Box>
        );
      
      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {showIcon && (
              <BotIcon 
                sx={{ 
                  fontSize: getSize(), 
                  color: theme.palette.primary.main,
                  mb: 1
                }} 
              />
            )}
            <CircularProgress 
              size={getSize()} 
              thickness={4}
              sx={{
                color: theme.palette.primary.main,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
        minHeight: size === 'large' ? 200 : size === 'small' ? 60 : 120
      }}
    >
      {renderContent()}
    </Box>
  );
};

export default LoadingState;
