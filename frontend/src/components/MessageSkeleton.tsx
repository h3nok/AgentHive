import React, { useEffect, useState } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

const statusSteps = [
  '🔍 Executing query...',
  '🧠 Running analysis...',
  '📦 Formatting response...'
];

const MessageSkeleton: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(0);

  // Reveal status lines one at a time
  useEffect(() => {
    if (visibleCount < statusSteps.length) {
      const timer = setTimeout(() => setVisibleCount(c => c + 1), 700);
      return () => clearTimeout(timer);
    }
  }, [visibleCount]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1.5,
      width: '100%',
      px: 2,
      py: 3
    }}>
      {/* Sequential status messages */}
      {statusSteps.slice(0, visibleCount).map((line, idx) => (
        <Typography key={idx} variant="body2" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: theme => theme.palette.text.secondary,
          opacity: 0,
          animation: 'fadeUp 0.5s forwards',
          animationDelay: `${idx * 0.1}s`,
          '@keyframes fadeUp': {
            '0%': { opacity: 0, transform: 'translateY(8px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}>
          {line}
        </Typography>
      ))}

      {/* Fallback animated dots when all status lines shown */}
      {visibleCount >= statusSteps.length && (
        <Typography variant="body2" sx={{
          fontStyle: 'italic',
          color: theme => theme.palette.text.secondary,
          '&::after': {
            display: 'inline-block',
            animation: 'ellipsis 1.4s infinite',
            content: '"..."',
            width: '1em',
            textAlign: 'left'
          },
          '@keyframes ellipsis': {
            '0%': { content: '""' },
            '33%': { content: '"."' },
            '66%': { content: '".."' },
            '100%': { content: '"..."' }
          }
        }}>
          Generating response
        </Typography>
      )}

      <LinearProgress color="primary" sx={{ height: 4, borderRadius: 2, my: 1 }} />

      {/* Placeholder skeleton lines */}
      {[1, 2, 3].map((line) => (
        <Box 
          key={line}
          sx={{ 
            height: 16, 
            width: `${line === 1 ? 90 : line === 2 ? 80 : 60}%`, 
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
            borderRadius: 0.5,
            mt: 1,
            animation: `pulse 1.5s ease-in-out ${line * 0.15}s infinite`,
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 0.3 },
              '100%': { opacity: 0.6 },
            }
          }} 
        />
      ))}
    </Box>
  );
};

export default React.memo(MessageSkeleton); 