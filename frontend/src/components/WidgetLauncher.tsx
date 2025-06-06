import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import LogoText from './LogoText';

interface WidgetLauncherProps {
  onClick: () => void;
}

const WidgetLauncher: React.FC<WidgetLauncherProps> = ({ onClick }) => {
  return (
    <Tooltip title="Chat with AutoTractor" placement="left" arrow>
      <IconButton
        component={motion.button}
        whileTap={{ scale: 0.9, rotate: 90 }}
        onClick={onClick}
        aria-label="Open chat"
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: (theme) => theme.zIndex.tooltip + 10,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c21f1a 0%, #a50d24 100%)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0,
          '&:hover': {
            background: 'linear-gradient(135deg, #b81717 0%, #921119 100%)',
          },
        }}
      >
        <LogoText size="small" showOnlyBubble animated interactive />
      </IconButton>
    </Tooltip>
  );
};

export default WidgetLauncher; 