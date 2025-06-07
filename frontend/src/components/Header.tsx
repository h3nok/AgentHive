import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import TractorIcon from './icons/TractorIcon';
import StatusBadge from './StatusBadge';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = "" }) => {
  const theme = useTheme();

  return (
    <Box
      className={`flex items-center gap-1 text-red-600 ${className}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: '#2979FF', // Enterprise Blue
      }}
    >
      {/* Logo with TractorIcon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        <TractorIcon 
          className="h-5 w-5"
          sx={{ 
            fontSize: '1.25rem',
            color: '#c8102e',
          }} 
        />
        <Typography
          variant="h6"
          component="span"
          className="font-semibold"
          sx={{
            fontWeight: 600,
            color: '#c8102e',
            letterSpacing: '-0.02em',
          }}
        >
          Autoprise
        </Typography>
      </Box>

      {/* Live Status Pill */}
      <StatusBadge status="online" size="small" />
    </Box>
  );
};

export default Header; 