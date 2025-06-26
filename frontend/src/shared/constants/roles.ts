export const ROLES = {
  ADMIN: 'admin',
  OPS: 'ops',
  USER: 'user',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
