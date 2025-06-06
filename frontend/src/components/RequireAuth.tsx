import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface RequireAuthProps {
  children: JSX.Element;
  roles?: string[];
}

/**
 * Global route-guard that redirects to /login when the user is unauthenticated
 * and to / (landing) when missing required roles.  Uses AuthContext so any
 * future auth-provider swap is isolated.
 */
const RequireAuth: React.FC<RequireAuthProps> = ({ children, roles }) => {
  const { isAuthenticated, account } = useAuth();
  const location = useLocation();

  // Skip guard entirely when auth is disabled for dev/local
  const isAuthDisabled = import.meta.env.VITE_AUTH_ENABLED === 'false';
  if (isAuthDisabled) return children;

  // While MSAL processes redirect or we don't yet know auth state, show spinner
  if (typeof isAuthenticated === 'undefined') {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Not authenticated → send to login, preserving return path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role enforcement if provided
  if (roles && roles.length > 0) {
    const userRoles: string[] = (account?.idTokenClaims?.roles as string[]) || [];
    const hasRequiredRole = userRoles.some(r => roles.includes(r));
    if (!hasRequiredRole) {
      console.warn(
        `RequireAuth: access denied. Need [${roles.join(', ')}] but user has [${userRoles.join(', ')}]`);
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default RequireAuth;
