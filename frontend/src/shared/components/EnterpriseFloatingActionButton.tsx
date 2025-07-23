import React from 'react';
import { 
  Fab, 
  FabProps, 
  Tooltip, 
  useTheme, 
  alpha,
  Box 
} from '@mui/material';
import { motion } from 'framer-motion';

interface EnterpriseFloatingActionButtonProps extends Omit<FabProps, 'children'> {
  icon: React.ReactNode;
  tooltip?: string;
  colorVariant?: 'primary' | 'secondary' | 'honey';
  glowEffect?: boolean;
}

// Helper function to get color variants
const getColorVariant = (theme: any, colorVariant: 'primary' | 'secondary' | 'honey' = 'primary') => {
  switch (colorVariant) {
    case 'honey':
      return {
        background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
        color: theme.palette.warning.contrastText,
        shadow: theme.palette.warning.main,
        hoverShadow: theme.palette.warning.dark,
      };
    case 'secondary':
      return {
        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
        color: theme.palette.secondary.contrastText,
        shadow: theme.palette.secondary.main,
        hoverShadow: theme.palette.secondary.dark,
      };
    default:
      return {
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: theme.palette.primary.contrastText,
        shadow: theme.palette.primary.main,
        hoverShadow: theme.palette.primary.dark,
      };
  }
};

const EnterpriseFloatingActionButton: React.FC<EnterpriseFloatingActionButtonProps> = ({
  icon,
  tooltip,
  colorVariant = 'primary',
  glowEffect = true,
  ...fabProps
}) => {
  const theme = useTheme();
  const colors = getColorVariant(theme, colorVariant);

  const fabSx = {
    background: colors.background,
    color: colors.color,
    border: `1px solid ${alpha(colors.shadow, 0.3)}`,
    boxShadow: glowEffect 
      ? `0 4px 20px ${alpha(colors.shadow, 0.25)}, 0 2px 10px ${alpha(colors.shadow, 0.15)}`
      : `0 2px 8px ${alpha(colors.shadow, 0.2)}`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(45deg, transparent 30%, ${alpha('#fff', 0.1)} 50%, transparent 70%)`,
      transform: 'translateX(-100%)',
      transition: 'transform 0.6s ease',
    },
    
    '&:hover': {
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: glowEffect 
        ? `0 8px 30px ${alpha(colors.hoverShadow, 0.35)}, 0 4px 15px ${alpha(colors.hoverShadow, 0.25)}`
        : `0 4px 15px ${alpha(colors.hoverShadow, 0.3)}`,
      
      '&:before': {
        transform: 'translateX(100%)',
      },
    },
    
    '&:active': {
      transform: 'translateY(-1px) scale(1.02)',
    },
    
    '&:focus': {
      outline: 'none',
      boxShadow: glowEffect 
        ? `0 8px 30px ${alpha(colors.hoverShadow, 0.35)}, 0 4px 15px ${alpha(colors.hoverShadow, 0.25)}, 0 0 0 3px ${alpha(colors.shadow, 0.3)}`
        : `0 4px 15px ${alpha(colors.hoverShadow, 0.3)}, 0 0 0 2px ${alpha(colors.shadow, 0.5)}`,
    },
  };

  const fabComponent = (
    <Box sx={{ position: 'relative' }}>
      <Box
        component={motion.div}
        whileHover={{
          rotate: [0, -1, 1, 0],
          transition: { duration: 0.3 }
        }}
        whileTap={{
          scale: 0.95,
          transition: { duration: 0.1 }
        }}
      >
        <Fab
          sx={fabSx}
          {...fabProps}
        >
          <Box
            component={motion.div}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {icon}
          </Box>
        </Fab>
      </Box>
      
      {/* Pulsing ring effect */}
      {glowEffect && (
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px solid ${colorVariant === 'honey' ? theme.palette.warning.main : 
                     colorVariant === 'secondary' ? theme.palette.secondary.main : 
                     theme.palette.primary.main}`,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
      )}
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="right" arrow>
        {fabComponent}
      </Tooltip>
    );
  }

  return fabComponent;
};

export default EnterpriseFloatingActionButton;
