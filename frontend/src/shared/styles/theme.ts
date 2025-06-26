import { createTheme } from '@mui/material/styles';

// Honey/Bee/Swarm Inspired Color Palette
const swarmColors = {
  // Primary honey/amber tones
  honey: '#FFB300',      // Main brand color - golden honey
  darkHoney: '#E65100',  // Darker honey for contrast
  lightHoney: '#FFC947', // Lighter honey for highlights
  cream: '#FFF8E1',      // Light cream background
  amber: '#FF8F00',      // Warm amber accent
  
  // Agent status colors
  idle: '#81C784',       // Soft green - peaceful
  busy: '#FFB74D',       // Orange - active work
  collaborating: '#64B5F6', // Blue - teamwork
  thinking: '#BA68C8',   // Purple - contemplation
  offline: '#90A4AE',    // Gray - inactive
  
  // Enhanced neutral tones for depth
  lightGray: '#F8F9FA',   // Slightly warmer light gray
  mediumGray: '#9E9E9E',  // Medium gray with better contrast
  darkGray: '#37474F',    // Darker gray for text
  
  // Improved light theme backgrounds
  lightBg: '#FDFDFD',     // Off-white with subtle warmth
  lightBgSecondary: '#F7F8FA', // Secondary background with slight blue tint
  lightPaper: '#FFFFFF',  // Pure white for contrast
  lightSurface: '#F5F7FA', // Light surface with depth
  
  // Dark mode specific - much lighter for better cohesion
  darkBg: '#2D2D2D',      // Lighter dark background
  darkPaper: '#383838',   // Lighter dark paper
  darkSurface: '#424242', // Lighter dark surface
  
  // Light mode sidebar - much more subtle
  lightSidebar: '#F9FAFB', // Very light with subtle blue tint
  lightSidebarBorder: '#E5E7EB', // Subtle border
};

// Light Theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: swarmColors.honey,
      dark: swarmColors.darkHoney,
      light: swarmColors.lightHoney,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: swarmColors.amber,
      dark: '#E65100',
      light: '#FFE0B2',
      contrastText: '#FFFFFF',
    },
    background: {
      default: `
        radial-gradient(ellipse at top left, rgba(120, 119, 198, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at top right, rgba(255, 179, 0, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
        linear-gradient(135deg, #FAFCFF 0%, #F8FAFC 25%, #F1F5F9 50%, #E2E8F0 75%, #CBD5E1 100%)
      `, // Advanced multi-layered gradient
      paper: 'rgba(255, 255, 255, 0.75)', // Enhanced glassmorphism
    },
    text: {
      primary: '#1E293B', // Much darker for better readability
      secondary: '#475569', // Darker secondary text
    },
    divider: '#CBD5E1', // More visible dividers
    // Custom status colors
    success: {
      main: swarmColors.idle,
    },
    warning: {
      main: swarmColors.busy,
    },
    info: {
      main: swarmColors.collaborating,
    },
    error: {
      main: '#F44336',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `
            radial-gradient(circle at 15% 85%, rgba(120, 119, 198, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 85% 15%, rgba(255, 179, 0, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
            linear-gradient(135deg, #FAFCFF 0%, #F8FAFC 20%, #F1F5F9 40%, #E2E8F0 70%, #CBD5E1 90%, #B4BCC8 100%)
          `,
          minHeight: '100vh',
          perspective: '1500px',
          transformStyle: 'preserve-3d',
          // Apply enhanced honey accent for admin pages
          '&.admin-page': {
            background: `
              radial-gradient(circle at 15% 85%, rgba(120, 119, 198, 0.1) 0%, transparent 45%),
              radial-gradient(circle at 85% 15%, rgba(255, 179, 0, 0.1) 0%, transparent 45%),
              radial-gradient(circle at 65% 65%, rgba(168, 85, 247, 0.06) 0%, transparent 60%),
              radial-gradient(circle at 25% 75%, rgba(59, 130, 246, 0.04) 0%, transparent 50%),
              linear-gradient(135deg, #FAFCFF 0%, #FFF9F0 15%, rgba(248, 250, 252, 0.98) 35%, rgba(241, 245, 249, 0.95) 60%, #E2E8F0 85%, #CBD5E1 100%)
            `,
          }
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(35px) saturate(1.2)',
          border: `1px solid rgba(255, 255, 255, 0.35)`,
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.12), 
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 1px 5px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1)
          `,
          transform: 'translateZ(0)',
          transformStyle: 'preserve-3d',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          // Add subtle inner glow
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 179, 0, 0.05) 100%)',
            pointerEvents: 'none',
            opacity: 0.7,
          },
          // Enhanced glassmorphism for cards
          '&.MuiCard-root': {
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(40px) saturate(1.3)',
            border: `1px solid rgba(255, 255, 255, 0.4)`,
            boxShadow: `
              0 16px 50px rgba(0, 0, 0, 0.15), 
              0 6px 25px rgba(0, 0, 0, 0.1),
              0 2px 10px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.7),
              inset 0 -1px 0 rgba(255, 255, 255, 0.2)
            `,
          }
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Completely transparent AppBar
          background: 'transparent',
          backdropFilter: 'none',
          borderBottom: 'none',
          boxShadow: 'none',
          position: 'relative',
          overflow: 'visible',
          // Remove all pseudo-elements
          '&::before': {
            display: 'none',
          },
          '&::after': {
            display: 'none',
          },
          // Admin styling also transparent
          '&.admin-appbar': {
            background: 'transparent',
            backdropFilter: 'none',
            borderBottom: 'none',
            boxShadow: 'none',
          }
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: `
            linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.85) 100%),
            linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, transparent 60%)
          `,
          backdropFilter: 'blur(40px) saturate(1.2)',
          borderRight: `1px solid rgba(255, 255, 255, 0.35)`,
          boxShadow: `
            12px 0 50px rgba(0, 0, 0, 0.18), 
            6px 0 25px rgba(0, 0, 0, 0.12),
            2px 0 10px rgba(0, 0, 0, 0.06),
            inset 1px 0 0 rgba(255, 255, 255, 0.5),
            inset -1px 0 0 rgba(255, 255, 255, 0.1)
          `,
          position: 'relative',
          overflow: 'hidden',
          transformStyle: 'preserve-3d',
          // Always show enhanced inner glow and depth
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 179, 0, 0.02) 30%, transparent 60%)',
            pointerEvents: 'none',
          },
          // Always show enhanced edge highlight
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, rgba(255, 179, 0, 0.4) 0%, rgba(139, 92, 246, 0.3) 50%, rgba(255, 179, 0, 0.4) 100%)',
            pointerEvents: 'none',
            filter: 'blur(0.5px)',
          }
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(40px) saturate(1.3)',
          border: `1px solid rgba(255, 255, 255, 0.4)`,
          boxShadow: `
            0 16px 50px rgba(0, 0, 0, 0.15), 
            0 6px 25px rgba(0, 0, 0, 0.1),
            0 2px 10px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.7),
            inset 0 -1px 0 rgba(255, 255, 255, 0.2)
          `,
          transform: 'translateZ(0) rotateX(0deg)',
          transformStyle: 'preserve-3d',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          // Add floating glow effect
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 40%, rgba(255, 179, 0, 0.05) 100%)',
            pointerEvents: 'none',
            opacity: 0.8,
          },
          '&:hover': {
            transform: 'translateY(-12px) translateZ(30px) rotateX(3deg) scale(1.02)',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(50px) saturate(1.4)',
            boxShadow: `
              0 35px 70px rgba(0, 0, 0, 0.2), 
              0 20px 40px rgba(0, 0, 0, 0.15),
              0 8px 20px rgba(255, 179, 0, 0.15),
              0 4px 10px rgba(139, 92, 246, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.9),
              inset 0 -1px 0 rgba(255, 255, 255, 0.3)
            `,
            border: `1px solid rgba(255, 179, 0, 0.5)`,
            '&::before': {
              opacity: 1,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 179, 0, 0.08) 50%, rgba(139, 92, 246, 0.05) 100%)',
            }
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          fontWeight: 600,
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px) saturate(1.2)',
          border: `1px solid rgba(255, 255, 255, 0.45)`,
          boxShadow: `
            0 6px 20px rgba(0, 0, 0, 0.1), 
            0 3px 10px rgba(0, 0, 0, 0.06),
            0 1px 3px rgba(0, 0, 0, 0.03),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1)
          `,
          transform: 'translateZ(0)',
          transformStyle: 'preserve-3d',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          // Add inner glow
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
            pointerEvents: 'none',
            borderRadius: 'inherit',
          },
          '&:hover': {
            transform: 'translateY(-3px) translateZ(15px) scale(1.05)',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(25px) saturate(1.3)',
            boxShadow: `
              0 12px 35px rgba(0, 0, 0, 0.15), 
              0 6px 18px rgba(0, 0, 0, 0.1),
              0 2px 8px rgba(255, 179, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.9),
              inset 0 -1px 0 rgba(255, 255, 255, 0.2)
            `,
            border: `1px solid rgba(255, 179, 0, 0.3)`,
            '&::before': {
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 179, 0, 0.05) 100%)',
            }
          },
        },
        colorPrimary: {
          background: `
            linear-gradient(135deg, ${swarmColors.honey} 0%, ${swarmColors.lightHoney} 50%, ${swarmColors.amber} 100%),
            linear-gradient(45deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)
          `,
          color: '#FFFFFF',
          border: 'none',
          boxShadow: `
            0 8px 25px rgba(255, 179, 0, 0.35), 
            0 4px 12px rgba(255, 179, 0, 0.25),
            0 1px 4px rgba(255, 179, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          transform: 'translateZ(0)',
          transformStyle: 'preserve-3d',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 60%)',
            pointerEvents: 'none',
            borderRadius: 'inherit',
          },
          '&:hover': {
            transform: 'translateY(-2px) translateZ(10px) scale(1.02)',
            boxShadow: `
              0 12px 35px rgba(255, 179, 0, 0.45), 
              0 6px 18px rgba(255, 179, 0, 0.35),
              0 2px 8px rgba(255, 179, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 0 rgba(0, 0, 0, 0.15)
            `,
            '&::before': {
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, transparent 50%)',
            }
          }
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 18,
          fontWeight: 600,
          boxShadow: 'none',
          transform: 'translateZ(0)',
          transformStyle: 'preserve-3d',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: `
              0 12px 35px rgba(0, 0, 0, 0.18),
              0 6px 18px rgba(0, 0, 0, 0.12),
              0 2px 8px rgba(0, 0, 0, 0.06)
            `,
            transform: 'translateY(-3px) translateZ(15px) scale(1.02)',
          },
        },
        contained: {
          background: `
            linear-gradient(135deg, ${swarmColors.honey} 0%, ${swarmColors.amber} 50%, ${swarmColors.darkHoney} 100%),
            linear-gradient(45deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)
          `,
          color: '#FFFFFF',
          boxShadow: `
            0 8px 25px rgba(255, 179, 0, 0.4),
            0 4px 12px rgba(255, 179, 0, 0.3),
            0 1px 4px rgba(255, 179, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          // Add inner glow
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, transparent 50%)',
            pointerEvents: 'none',
            borderRadius: 'inherit',
          },
          '&:hover': {
            background: `
              linear-gradient(135deg, ${swarmColors.darkHoney} 0%, ${swarmColors.amber} 50%, ${swarmColors.honey} 100%),
              linear-gradient(45deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)
            `,
            boxShadow: `
              0 15px 45px rgba(255, 179, 0, 0.5),
              0 8px 25px rgba(255, 179, 0, 0.4),
              0 3px 12px rgba(255, 179, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.45),
              inset 0 -1px 0 rgba(0, 0, 0, 0.15)
            `,
            transform: 'translateY(-4px) translateZ(20px) scale(1.03)',
            '&::before': {
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, transparent 40%)',
            }
          },
        },
        outlined: {
          borderColor: swarmColors.honey,
          color: swarmColors.honey,
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px) saturate(1.2)',
          border: `1px solid rgba(255, 179, 0, 0.35)`,
          boxShadow: `
            0 6px 20px rgba(0, 0, 0, 0.1), 
            0 3px 10px rgba(0, 0, 0, 0.06),
            0 1px 3px rgba(0, 0, 0, 0.03),
            inset 0 1px 0 rgba(255, 255, 255, 0.7),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1)
          `,
          // Add inner glow
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
            pointerEvents: 'none',
            borderRadius: 'inherit',
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 179, 0, 0.12)',
            borderColor: swarmColors.darkHoney,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(25px) saturate(1.3)',
            boxShadow: `
              0 12px 35px rgba(255, 179, 0, 0.25), 
              0 6px 18px rgba(255, 179, 0, 0.2),
              0 2px 8px rgba(255, 179, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.8),
              inset 0 -1px 0 rgba(255, 255, 255, 0.2)
            `,
            transform: 'translateY(-3px) translateZ(15px) scale(1.02)',
            '&::before': {
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 179, 0, 0.05) 100%)',
            }
          },
        },
        text: {
          color: swarmColors.honey,
          background: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: 'rgba(255, 179, 0, 0.12)',
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(15px)',
            boxShadow: `
              0 6px 20px rgba(0, 0, 0, 0.08), 
              0 3px 10px rgba(0, 0, 0, 0.04)
            `,
            transform: 'translateY(-1px) translateZ(5px)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${swarmColors.honey} 0%, ${swarmColors.amber} 100%)`,
          color: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(255, 179, 0, 0.3)',
          '&:hover': {
            background: `linear-gradient(135deg, ${swarmColors.darkHoney} 0%, ${swarmColors.amber} 100%)`,
            boxShadow: '0 6px 20px rgba(255, 179, 0, 0.4)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: swarmColors.darkHoney,
    },
    h5: {
      fontWeight: 600,
      color: swarmColors.darkHoney,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      color: swarmColors.mediumGray,
    },
  },
});

// Dark Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: swarmColors.lightHoney,
      dark: swarmColors.honey,
      light: '#FFECB3',
      contrastText: '#1A1A1A',
    },
    secondary: {
      main: swarmColors.amber,
      dark: '#FF6F00',
      light: '#FFE0B2',
      contrastText: '#1A1A1A',
    },
    background: {
      default: swarmColors.darkBg,
      paper: swarmColors.darkPaper,
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
    },
    divider: '#424242',
    // Custom status colors (adjusted for dark mode)
    success: {
      main: '#66BB6A',
    },
    warning: {
      main: '#FFA726',
    },
    info: {
      main: '#42A5F5',
    },
    error: {
      main: '#EF5350',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: swarmColors.darkBg,
          minHeight: '100vh',
          // Apply honey gradient only to admin pages
          '&.admin-page': {
            background: `linear-gradient(135deg, ${swarmColors.darkBg} 0%, #353535 50%, #404040 100%)`,
          }
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: swarmColors.darkPaper,
          border: `1px solid ${swarmColors.honey}15`,
          boxShadow: '0 2px 8px rgba(255, 193, 7, 0.15)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Only apply admin styling to AppBars with admin class
          '&.admin-appbar': {
            background: 'rgba(45, 45, 45, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${swarmColors.honey}20`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: swarmColors.darkPaper,
          borderRight: `1px solid ${swarmColors.honey}20`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: swarmColors.darkSurface,
          borderRadius: 16,
          border: `1px solid ${swarmColors.honey}10`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 28px rgba(255, 193, 7, 0.25)',
            borderColor: `${swarmColors.honey}30`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
          backgroundColor: swarmColors.darkSurface,
          border: `1px solid ${swarmColors.honey}30`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${swarmColors.lightHoney} 0%, ${swarmColors.amber} 100%)`,
          color: '#1A1A1A',
          '&:hover': {
            background: `linear-gradient(135deg, ${swarmColors.honey} 0%, ${swarmColors.amber} 100%)`,
            boxShadow: '0 6px 20px rgba(255, 193, 7, 0.4)',
          },
        },
        outlined: {
          borderColor: swarmColors.lightHoney,
          color: swarmColors.lightHoney,
          '&:hover': {
            backgroundColor: 'rgba(255, 193, 7, 0.08)',
            borderColor: swarmColors.honey,
          },
        },
        text: {
          color: swarmColors.lightHoney,
          '&:hover': {
            backgroundColor: 'rgba(255, 193, 7, 0.08)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${swarmColors.lightHoney} 0%, ${swarmColors.amber} 100%)`,
          color: '#1A1A1A',
          boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
          '&:hover': {
            background: `linear-gradient(135deg, ${swarmColors.honey} 0%, ${swarmColors.amber} 100%)`,
            boxShadow: '0 6px 20px rgba(255, 193, 7, 0.4)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: swarmColors.lightHoney,
    },
    h5: {
      fontWeight: 600,
      color: swarmColors.lightHoney,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      color: '#90A4AE',
    },
  },
});

// Export swarm colors for use in components
export { swarmColors };
export { lightTheme, darkTheme };
export default lightTheme; 