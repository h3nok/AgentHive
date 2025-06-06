// CaretBlink.tsx - Blinking caret for streaming text
import React from 'react';
import { Box } from '@mui/material';

const CaretBlink: React.FC = () => {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: '2px',
        height: '1em',
        backgroundColor: 'currentColor',
        marginLeft: '2px',
        verticalAlign: 'text-bottom',
        animation: 'caret-blink 1s infinite',
        '@keyframes caret-blink': {
          '0%, 50%': {
            opacity: 1,
          },
          '51%, 100%': {
            opacity: 0,
          },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          opacity: 1,
        },
      }}
    />
  );
};

export default React.memo(CaretBlink);
