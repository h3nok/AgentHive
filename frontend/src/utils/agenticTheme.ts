import { alpha, Theme } from '@mui/material';

// Enhanced color palette for agentic interface
export const AGENTIC_COLORS = {
  primary: {
    main: '#667eea',
    light: '#8b9def',
    dark: '#4c63d2',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  agent: {
    thinking: '#2196f3',
    processing: '#ff9800',
    ready: '#4caf50',
    busy: '#ff5722',
    error: '#f44336'
  },
  confidence: {
    high: '#4caf50',
    medium: '#ff9800',
    low: '#f44336'
  },
  context: {
    file: '#10b981',
    conversation: '#8b5cf6',
    knowledge: '#f59e0b',
    memory: '#ef4444'
  }
};

// Animation utilities
export const ANIMATIONS = {
  pulse: {
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '50%': { transform: 'scale(1.05)', opacity: 0.8 },
      '100%': { transform: 'scale(1)', opacity: 1 }
    }
  },
  glow: (color: string) => ({
    '@keyframes glow': {
      '0%': { boxShadow: `0 0 5px ${alpha(color, 0.5)}` },
      '50%': { boxShadow: `0 0 20px ${alpha(color, 0.8)}` },
      '100%': { boxShadow: `0 0 5px ${alpha(color, 0.5)}` }
    }
  }),
  thinking: {
    '@keyframes thinking': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  },
  fadeInUp: {
    '@keyframes fadeInUp': {
      '0%': { opacity: 0, transform: 'translateY(20px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' }
    }
  }
};

// Glass morphism effects
export const createGlassMorphism = (theme: Theme, intensity: number = 0.1) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
  backdropFilter: `blur(${10 + intensity * 10}px)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`
});

// Gradient text utility
export const createGradientText = (gradient: string) => ({
  background: gradient,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 600
});

// Enhanced button styles
export const createAgenticButton = (theme: Theme, variant: 'primary' | 'secondary' | 'agent' = 'primary') => {
  const baseStyles = {
    borderRadius: 2,
    textTransform: 'none' as const,
    fontWeight: 500,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: 'left 0.5s ease',
    },
    '&:hover::before': {
      left: '100%',
    },
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.25)}`
    }
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        background: AGENTIC_COLORS.primary.gradient,
        color: 'white',
        '&:hover': {
          ...baseStyles['&:hover'],
          background: `linear-gradient(135deg, ${AGENTIC_COLORS.primary.dark} 0%, #5a4894 100%)`
        }
      };
    
    case 'secondary':
      return {
        ...baseStyles,
        background: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        '&:hover': {
          ...baseStyles['&:hover'],
          background: alpha(theme.palette.primary.main, 0.2),
          borderColor: theme.palette.primary.main
        }
      };
    
    case 'agent':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
        color: theme.palette.secondary.main,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        '&:hover': {
          ...baseStyles['&:hover'],
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.light, 0.2)} 100%)`,
          borderColor: theme.palette.secondary.main,
          boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.25)}`
        }
      };
  }
};

// Enhanced card styles
export const createAgenticCard = (theme: Theme, elevation: number = 1) => ({
  borderRadius: 3,
  background: createGlassMorphism(theme, 0.1).background,
  backdropFilter: createGlassMorphism(theme, 0.1).backdropFilter,
  border: createGlassMorphism(theme, 0.1).border,
  boxShadow: elevation > 1 ? 
    `0 ${elevation * 4}px ${elevation * 16}px ${alpha(theme.palette.common.black, 0.1)}` :
    `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 ${(elevation + 1) * 4}px ${(elevation + 1) * 16}px ${alpha(theme.palette.common.black, 0.15)}`
  }
});

// Status indicator styles
export const createStatusIndicator = (status: 'online' | 'busy' | 'offline' | 'thinking', animated: boolean = true) => {
  const colors = {
    online: '#4caf50',
    busy: '#ff9800',
    offline: '#9e9e9e',
    thinking: '#2196f3'
  };

  const baseStyles = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: colors[status],
    boxShadow: `0 0 8px ${alpha(colors[status], 0.5)}`
  };

  if (animated && (status === 'thinking' || status === 'online')) {
    return {
      ...baseStyles,
      animation: status === 'thinking' ? 'pulse 1s infinite' : 'pulse 2s infinite',
      ...ANIMATIONS.pulse
    };
  }

  return baseStyles;
};

// Confidence level styling
export const createConfidenceDisplay = (confidence: number, theme: Theme) => {
  const color = confidence >= 80 ? AGENTIC_COLORS.confidence.high :
               confidence >= 60 ? AGENTIC_COLORS.confidence.medium :
               AGENTIC_COLORS.confidence.low;

  return {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color,
    fontWeight: 600,
    '& .confidence-bar': {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: alpha(color, 0.2),
      position: 'relative' as const,
      overflow: 'hidden' as const,
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: `${confidence}%`,
        backgroundColor: color,
        borderRadius: 2,
        transition: 'width 0.5s ease'
      }
    }
  };
};

// Context tag styling
export const createContextTag = (type: 'file' | 'conversation' | 'knowledge' | 'memory', theme: Theme) => {
  const color = AGENTIC_COLORS.context[type];
  
  return {
    backgroundColor: alpha(color, 0.1),
    color,
    border: `1px solid ${alpha(color, 0.3)}`,
    borderRadius: 2,
    padding: '4px 8px',
    fontSize: '0.7rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(color, 0.2),
      borderColor: color,
      transform: 'scale(1.05)'
    }
  };
};

// Dark theme enhancements
export const enhanceDarkTheme = (theme: Theme) => ({
  ...theme,
  palette: {
    ...theme.palette,
    background: {
      default: '#0a0e1a',
      paper: '#1a1f2e'
    },
    primary: {
      ...theme.palette.primary,
      main: '#7c8cfa'
    }
  },
  components: {
    ...theme.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(124, 140, 250, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          backdropFilter: 'blur(10px)'
        }
      }
    }
  }
});

export default {
  AGENTIC_COLORS,
  ANIMATIONS,
  createGlassMorphism,
  createGradientText,
  createAgenticButton,
  createAgenticCard,
  createStatusIndicator,
  createConfidenceDisplay,
  createContextTag,
  enhanceDarkTheme
};
