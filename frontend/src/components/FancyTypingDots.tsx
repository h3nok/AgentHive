import React from 'react';
import { keyframes, Box } from '@mui/material';

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const FancyTypingDots: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: `${bounce} 1.3s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
    </Box>
  );
};

export default FancyTypingDots; 