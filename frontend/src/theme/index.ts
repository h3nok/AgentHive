import { createTheme, ThemeOptions } from '@mui/material';
import { lightColors, darkColors } from './colors';
import { radii, motion } from './tokens';

export const createAppTheme = (mode: 'light' | 'dark'): ThemeOptions => {
  const c = mode === 'light' ? lightColors : darkColors;
  return createTheme({
    palette: {
      mode,
      primary: {
        main: c.honey,
        light: c.honeyLight,
        dark: c.honeyDark,
        contrastText: '#fff',
      },
      background: {
        default: c.surfaceAlt,
        paper: c.surface,
      },
      text: {
        primary: c.onSurface,
        secondary: c.onSurfaceSecondary,
      },
      divider: c.divider,
    },
    shape: { borderRadius: radii.md },
    transitions: { duration: { shortest: 150, shorter: 200, short: 250, standard: 300 } },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            transition: `transform ${motion.fast}`,
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
        },
      },
    },
  });
};
