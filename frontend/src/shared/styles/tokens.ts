/*
  Global design tokens for AgentHive UI system.
  Only primitive constants live here.  Derived values should be computed in theme/index.ts.
*/

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const z = {
  base: 0,
  header: 700,
  nav: 800,
  overlay: 900,
  modal: 1000,
  tooltip: 1100,
} as const;

export const motion = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
