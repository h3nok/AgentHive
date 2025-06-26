import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { AccountInfo } from '@azure/msal-browser';

const isAuthDisabled = import.meta.env.VITE_AUTH_ENABLED === 'false';

// Mock account object for when auth is disabled
const mockAccount: AccountInfo = {
  homeAccountId: 'mock-account',
  localAccountId: 'mock-account',
  environment: 'mock',
  tenantId: 'mock-tenant',
  username: 'mock.user@example.com',
  name: 'Mock User',
  idTokenClaims: {},
};

/**
 * A thin context-wrapper around `@azure/msal-react`.  Using this context instead
 * of the raw MSAL hooks avoids vendor-lock throughout the component-tree and
 * enables future replacement (e.g. switching to a custom OIDC provider) without
 * touching consumers.
 */
export interface AuthContextValue {
  /** Whether a user/token is currently present */
  isAuthenticated: boolean;
  /** Convenience: the first MSAL account (if any) */
  account: AccountInfo | null;
  /** Triggers the MSAL login flow */
  login: () => Promise<void>;
  /** Logs the user out and clears all cached data */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const login = useCallback(async () => {
    if (isAuthDisabled) return;
    await instance.loginRedirect();
  }, [instance]);

  const logout = useCallback(async () => {
    if (isAuthDisabled) return;
    await instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin + '/login' });
  }, [instance]);

  const contextValue = useMemo(() => ({
    isAuthenticated: isAuthDisabled ? true : isAuthenticated,
    account: isAuthDisabled ? mockAccount : instance.getActiveAccount(),
    login,
    logout,
  }), [isAuthenticated, instance, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}; 