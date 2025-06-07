import React, { useState } from 'react';
import { IconButton, Badge, Tooltip, keyframes, SvgIcon, SvgIconProps } from '@mui/material';

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(41, 121, 255, 0.25);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 8px 32px rgba(41, 121, 255, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(41, 121, 255, 0.25);
  }
`;

const TractorIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M4 18.5c0-1.38 1.12-2.5 2.5-2.5S9 17.12 9 18.5 7.88 21 6.5 21 4 19.88 4 18.5zm13 0c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5zM18 13V9c0-.55-.45-1-1-1h-2V6c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v2H5c-.55 0-1 .45-1 1v4H2c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h1.46c.34-1.37 1.54-2.4 2.97-2.5H18.57c1.43.1 2.63 1.13 2.97 2.5H23c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1h-2zm-8-5h4v2h-4V8z"
    fill="currentColor"
      />
    </SvgIcon>
);
};

export function WidgetLauncher(props: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip 
      title="Ask Autoprise - Your Ubiqora AI Assistant | the autonomous future" 
      placement="top"
      arrow
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            bgcolor: '#1a1a1a',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            borderRadius: 2,
          },
          '& .MuiTooltip-arrow': {
            color: '#1a1a1a',
          },
        }
      }}
    >
      <Badge
        badgeContent=""
        variant="dot"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 2000,
          '& .MuiBadge-badge': {
            backgroundColor: '#2E7D32',
            boxShadow: '0 0 8px rgba(46, 125, 50, 0.6)',
            animation: `${pulseAnimation} 2s infinite ease-in-out`,
            width: 12,
            height: 12,
            top: 8,
            right: 8,
          }
        }}
      >
        <IconButton
          onClick={props.onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Open Ubiqora AI Assistant"
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `linear-gradient(135deg, #00E5FF 0%, #2979FF 50%, #651FFF 100%)`,
            color: 'white',
            padding: 0,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
            boxShadow: isHovered 
              ? '0 12px 40px rgba(41, 121, 255, 0.4), 0 4px 12px rgba(0,0,0,0.15)'
              : '0 6px 24px rgba(41, 121, 255, 0.25), 0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              background: `linear-gradient(135deg, #00C2E0 0%, #2962FF 50%, #5E35B1 100%)`,
            },
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(to right, transparent 0%, rgba(255,255,255,.15) 50%, transparent 100%)`,
              transform: 'skewX(-25deg)',
              animation: isHovered ? `${keyframes`
                0% { left: -100%; }
                100% { left: 100%; }
              `} 1s` : 'none',
            }
          }}
        >
          <TractorIcon sx={{ fontSize: 32 }} />
        </IconButton>
      </Badge>
    </Tooltip>
  );
}
