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

const BeeIcon: React.FC<{ fontSize?: number; style?: React.CSSProperties }> = ({ fontSize = 36, style }) => {
  return (
    <span 
      style={{ 
        fontSize: `${fontSize}px`, 
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 2px 8px rgba(255, 204, 0, 0.5))',
        ...style
      }}
      role="img"
      aria-label="AgentHive Bee"
    >
      🐝
    </span>
  );
};

export function WidgetLauncher(props: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip 
      title="AgentHive - Your AI Assistant Swarm" 
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
          aria-label="Open AgentHive AI Assistant"
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            // background: `linear-gradient(135deg,rgb(204, 255, 0) 0%,rgb(157, 142, 43) 50%,rgb(126, 199, 36) 100%)`,
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
              background: `linear-gradient(135deg,rgb(224, 90, 0) 0%,rgb(230, 255, 41) 50%, #5E35B1 100%)`,
            },
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              transition: 'left 0.6s ease',
              zIndex: 1,
            },
            '&:hover:before': {
              left: '100%',
            },
            '&:after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              zIndex: 1,
            }
          }}
        >
          <div style={{ 
            transform: isHovered ? 'rotate(5deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            zIndex: 2,
            position: 'relative',
          }}>
            <BeeIcon fontSize={36} />
          </div>
        </IconButton>
      </Badge>
    </Tooltip>
  );
}
