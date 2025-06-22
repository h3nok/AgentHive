import { alpha, Theme } from '@mui/material/styles';

/**
 * Enterprise Theme Utilities for AgentHive
 * Provides consistent honey/swarm-inspired styling across the application
 */

// Primary enterprise colors (replacing red #c8102e)
export const ENTERPRISE_COLORS = {
  // Primary honey/amber colors
  honey: {
    light: '#ffd54f',
    main: '#ffb300',
    dark: '#ff8f00',
  },
  // Secondary swarm colors
  swarm: {
    light: '#66bb6a',
    main: '#4caf50',
    dark: '#388e3c',
  },
  // Supporting colors
  accent: {
    light: '#81c784',
    main: '#66bb6a',
    dark: '#4caf50',
  }
} as const;

/**
 * Get enterprise gradient backgrounds
 */
export const getEnterpriseGradient = (
  type: 'primary' | 'secondary' | 'honey' | 'success' = 'primary',
  theme?: Theme
) => {
  if (!theme) {
    return `linear-gradient(135deg, ${ENTERPRISE_COLORS.honey.main} 0%, ${ENTERPRISE_COLORS.honey.dark} 100%)`;
  }
  
  switch (type) {
    case 'honey':
      return `linear-gradient(135deg, ${ENTERPRISE_COLORS.honey.main} 0%, ${ENTERPRISE_COLORS.honey.dark} 100%)`;
    case 'secondary':
      return `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`;
    case 'success':
      return `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`;
    default:
      return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
  }
};

/**
 * Get enterprise button styles
 */
export const getEnterpriseButtonStyles = (
  variant: 'primary' | 'secondary' | 'honey' = 'primary',
  theme: Theme
) => ({
  background: getEnterpriseGradient(variant, theme),
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
  borderRadius: theme.shape.borderRadius || 8,
  textTransform: 'none' as const,
  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  position: 'relative' as const,
  overflow: 'hidden' as const,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:before': {
    content: '""',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg, transparent 30%, ${alpha('#fff', 0.1)} 50%, transparent 70%)`,
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease',
  },
  
  '&:hover': {
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'translateY(-1px)',
    
    '&:before': {
      transform: 'translateX(100%)',
    },
  }
});

/**
 * Get enterprise icon button styles
 */
export const getEnterpriseIconButtonStyles = (
  variant: 'primary' | 'secondary' | 'honey' = 'primary',
  theme: Theme
) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.shape.borderRadius || 8,
  color: theme.palette.primary.main,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  
  '&:before': {
    content: '""',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.1)})`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    borderColor: alpha(theme.palette.primary.main, 0.4),
    transform: 'translateY(-1px) scale(1.05)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
    
    '&:before': {
      opacity: 1,
    },
  }
});

/**
 * Get enterprise dialog styles
 */
export const getEnterpriseDialogStyles = (theme: Theme) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
    boxShadow: theme.palette.mode === 'dark' 
      ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
      : `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
    borderRadius: 16,
    border: theme.palette.mode === 'dark'
      ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
      : `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    backdropFilter: 'blur(8px)',
  },
  '& .MuiDialogTitle-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.primary.main, 0.08)
      : alpha(theme.palette.primary.main, 0.04),
    borderBottom: `1px solid ${theme.palette.mode === 'dark' 
      ? alpha(theme.palette.primary.main, 0.2) 
      : alpha(theme.palette.primary.main, 0.15)}`,
    color: theme.palette.primary.main,
    fontWeight: 600,
    position: 'relative' as const,
    '&:after': {
      content: '""',
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.warning.main})`,
    }
  },
  '& .MuiDialogContent-root': {
    paddingTop: theme.spacing(3),
  },
  '& .MuiButton-containedPrimary': {
    ...getEnterpriseButtonStyles('primary', theme)
  },
  '& .MuiButton-outlined': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    '&:hover': {
      borderColor: theme.palette.primary.dark,
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    }
  }
});

/**
 * Get enterprise input/form field styles
 */
export const getEnterpriseInputStyles = () => ({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: 'primary.main',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'primary.main',
  },
});

/**
 * Replace hardcoded red colors with enterprise theme
 */
export const replaceRedWithEnterprise = (colorValue: string, theme: Theme): string => {
  const redColors = ['#c8102e', '#C8102E', '#b71c1c', '#c21f1a', '#d63638', '#a50d24'];
  
  if (redColors.includes(colorValue)) {
    return theme.palette.primary.main;
  }
  
  return colorValue;
};

export default {
  ENTERPRISE_COLORS,
  getEnterpriseGradient,
  getEnterpriseButtonStyles,
  getEnterpriseIconButtonStyles,
  getEnterpriseDialogStyles,
  getEnterpriseInputStyles,
  replaceRedWithEnterprise,
};
