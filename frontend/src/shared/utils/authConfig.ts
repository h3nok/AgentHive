import { Configuration, LogLevel } from '@azure/msal-browser';

const {
  VITE_AAD_CLIENT_ID = '',
  VITE_AAD_TENANT_ID = 'common',
  VITE_AAD_SCOPE,
  VITE_AUTH_ENABLED = 'false'
} = import.meta.env;

// Default empty config when auth is disabled
export const msalConfig: Configuration = VITE_AUTH_ENABLED === 'true' ? {
  auth: {
    clientId: VITE_AAD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${VITE_AAD_TENANT_ID}`,
    redirectUri: window.location.origin + window.location.pathname,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string) => {
        if (level === LogLevel.Error) console.error(message);
      },
      logLevel: LogLevel.Error,
      piiLoggingEnabled: false,
    },
  },
} : {
  // Minimal config when auth is disabled
  auth: {
    clientId: '00000000-0000-0000-0000-000000000000',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin + window.location.pathname,
  },
};

export const loginRequest = VITE_AUTH_ENABLED === 'true' ? {
  scopes: [VITE_AAD_SCOPE || `${VITE_AAD_CLIENT_ID}/.default`],
} : {
  scopes: ['openid', 'profile', 'offline_access'],
}; 