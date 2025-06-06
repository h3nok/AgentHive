import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { keyframes } from '@mui/system';

// Typing animation
const typingDots = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
`;

interface HRAgentTypingIndicatorProps {
  show: boolean;
}

export const HRAgentTypingIndicator: React.FC<HRAgentTypingIndicatorProps> = ({ show }) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        p: 2,
        maxWidth: 400,
        mb: 2,
        animation: 'fadeIn 0.3s ease-in'
      }}
    >
      {/* HR Agent Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: 'transparent',
          color: 'white',
          fontSize: 16,
          fontWeight: 700,
          animation: `${pulse} 2s infinite`,
          border: 'none'
        }}
      >
        HR
      </Avatar>

      {/* Typing bubble */}
      <Box
        sx={{
          bgcolor: 'transparent',
          borderRadius: '20px 20px 20px 8px',
          px: 3,
          py: 2,
          position: 'relative',
          border: 'none',
          boxShadow: 'none',
          minWidth: 80
        }}
      >
        {/* Typing dots */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            justifyContent: 'center'
          }}
        >
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'transparent', // Make dots transparent too
                animation: `${typingDots} 1.4s infinite ease-in-out`,
                animationDelay: `${index * 0.16}s`
              }}
            />
          ))}
        </Box>

        {/* Speech bubble tail */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: -6,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent'
          }}
        />
      </Box>

      {/* Status text */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'transparent', // Make status indicator transparent
              animation: `${pulse} 1.5s infinite`
            }}
          />
          HR Agent is typing...
        </Typography>
      </Box>
    </Box>
  );
};
