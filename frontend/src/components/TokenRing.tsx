import React from 'react';
import { Box, Tooltip, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface TokenRingProps {
  progress: number; // 0-100
  tokens: number;
  maxTokens: number;
  costUsd: number;
}

const TokenRing: React.FC<TokenRingProps> = ({
  progress,
  tokens,
  maxTokens,
  costUsd,
}) => {
  const theme = useTheme();
  const radius = 14;
  const strokeWidth = 2;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Color based on usage
  const getColor = () => {
    if (progress < 50) return 'url(#sunrise)';
    if (progress < 80) return 'url(#sunrise)';
    return '#f44336';
  };

  return (
    <Tooltip
      title={
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Token Usage
          </Typography>
          <Typography variant="body2">
            {tokens.toLocaleString()} / {maxTokens.toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Estimated cost: ${costUsd.toFixed(2)}
          </Typography>
        </Box>
      }
      arrow
      placement="bottom"
    >
      <Box
        component={motion.div}
        whileHover={{ scale: 1.1 }}
        sx={{
          position: 'relative',
          width: radius * 2,
          height: radius * 2,
          cursor: 'pointer',
        }}
      >
        <svg
          height={radius * 2}
          width={radius * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Define sunrise gradient */}
          <defs>
            <linearGradient id="sunrise" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c21f1a" />
              <stop offset="100%" stopColor="#FF9B33" />
            </linearGradient>
          </defs>
          
          {/* Background circle */}
          <circle
            stroke={alpha(theme.palette.divider, 0.2)}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          
          {/* Progress circle */}
          <circle
            stroke={getColor()}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.3s ease',
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        
        {/* Center text */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.65rem',
              fontWeight: 700,
              color: progress > 80 ? 'error.main' : 'text.primary',
            }}
          >
            {progress}%
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default TokenRing; 