import React from 'react';
import { GlobalStyles } from '@mui/material';
import { lightColors, darkColors } from './colors';
import { radii } from './tokens';

interface Props {
  mode: 'light' | 'dark';
}

/**
 * Injects CSS custom properties so non-MUI CSS (e.g. raw css, animations) can share the same palette.
 */
export const ThemeCssVars: React.FC<Props> = ({ mode }) => {
  const c = mode === 'light' ? lightColors : darkColors;
  return (
    <GlobalStyles
      styles={{
        ':root': {
          '--bee-accent': c.honey,
          '--bee-accent-light': c.honeyLight,
          '--bee-accent-dark': c.honeyDark,
          '--surface': c.surface,
          '--surface-alt': c.surfaceAlt,
          '--canvas': c.canvas,
          '--text-primary': c.onSurface,
          '--text-secondary': c.onSurfaceSecondary,
          '--divider': c.divider,
          '--radius-md': `${radii.md}px`,
        },
      }}
    />
  );
};
