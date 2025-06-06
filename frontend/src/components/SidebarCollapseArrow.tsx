import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

interface SidebarCollapseArrowProps {
  isCollapsed: boolean;
  onClick: () => void;
}

const SidebarCollapseArrow: React.FC<SidebarCollapseArrowProps> = ({ 
  isCollapsed, 
  onClick 
}) => {
  return (
    <Box
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); onClick();}}}
      sx={{
        width: 24,
        height: 28,
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        '&:hover, &:focus-within': {
          '& .barn-door': {
            backgroundColor: '#d63638',
          },
        },
        outline:'none'
      }}
    >
      {/* Top half of barn door */}
      <Box
        component={motion.div}
        className="barn-door"
        animate={{
          translateY: isCollapsed ? '-4px' : '0px',
          rotate: isCollapsed ? '-18deg' : '0deg',
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 25,
        }}
        sx={{
          width: '6px',
          height: '12px',
          backgroundColor: '#b71c1c',
          borderRadius: '2px 2px 0 0',
          transformOrigin: 'bottom center',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(183, 28, 28, 0.3)',
          zIndex: 10,
        }}
      />
      
      {/* Bottom half of barn door */}
      <Box
        component={motion.div}
        className="barn-door"
        animate={{
          translateY: isCollapsed ? '4px' : '0px',
          rotate: isCollapsed ? '18deg' : '0deg',
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 25,
        }}
        sx={{
          width: '6px',
          height: '12px',
          backgroundColor: '#c21f1a',
          borderRadius: '0 0 2px 2px',
          transformOrigin: 'top center',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(194, 31, 26, 0.4)',
          zIndex: 10,
        }}
      />
    </Box>
  );
};

export default SidebarCollapseArrow; 