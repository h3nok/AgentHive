import { createTheme, ThemeOptions, Components, Theme } from '@mui/material/styles';

// -----------------------------------------------------------------------------
// Token definitions – single source of truth for Tractor Supply design system
// -----------------------------------------------------------------------------
const canvasLight = '#F8F4EE';
const canvasDark = '#14110F';
const surfaceLight = '#FFFFFF';
const surfaceDark = '#1F1B19';
const borderLight = 'rgba(0,0,0,0.06)';
const borderDark = 'rgba(255,255,255,0.08)';
const primaryRed = '#B71C1C';
const successGreen = '#1C8B46';
const warningAmber = '#E58E00';
const errorRed = '#B3261E';
const errorRedDark = '#CF6679';
const textHighLight = '#212121';
const textHighDark = '#FFFFFF';
const textMedLight = '#5F5F5F';
const textMedDark = '#BDBDBD';

// -----------------------------------------------------------------------------
// Helper to create Tractor Supply theme (light / dark)
// -----------------------------------------------------------------------------
export const createTractorTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';

  const palette: ThemeOptions['palette'] = {
    mode,
    background: {
      default: isLight ? canvasLight : canvasDark,
      paper: isLight ? surfaceLight : surfaceDark,
    },
    primary: {
      main: primaryRed,
    },
    success: {
      main: successGreen,
    },
    warning: {
      main: warningAmber,
    },
    error: {
      main: isLight ? errorRed : errorRedDark,
    },
    text: {
      primary: isLight ? textHighLight : textHighDark,
      secondary: isLight ? textMedLight : textMedDark,
    },
    divider: isLight ? borderLight : borderDark,
  };

  // Component overrides shared between light and dark
  const components: Components = {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => {
          const paperRoot = (theme.components?.MuiPaper?.styleOverrides?.root ?? {}) as Record<string, unknown>;
          return {
            ...paperRoot,
            padding: theme.spacing(3),
          };
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          // Use backdrop-filter only if user has not requested reduced motion
          '@media (prefers-reduced-motion: no-preference)': {
            backdropFilter: 'blur(12px)',
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
        },
        columnHeaders: {
          backgroundColor: isLight ? surfaceLight : surfaceDark,
        },
      },
    },
  } as Components;

  return createTheme({
    palette,
    components,
    shape: {
      borderRadius: 12,
    },
  });
};

// Convenience helper: default theme based on system preference
export const tractorThemeDefault = createTractorTheme(
  (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light'
);
