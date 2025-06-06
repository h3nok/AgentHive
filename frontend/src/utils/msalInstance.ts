import { PublicClientApplication, EventType, AuthenticationResult, EventMessage } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './authConfig';

// Check if authentication is disabled
const isAuthDisabled = import.meta.env.VITE_AUTH_ENABLED === 'false';

// Create a mock MSAL instance when auth is disabled
class MockPublicClientApplication {
  async initialize() { 
    console.log('Mock MSAL: initialize called');
  }
  async handleRedirectPromise() { 
    console.log('Mock MSAL: handleRedirectPromise called');
    return null; 
  }
  getAllAccounts() { 
    console.log('Mock MSAL: getAllAccounts called');
    return []; 
  }
  getActiveAccount() { 
    console.log('Mock MSAL: getActiveAccount called');
    return null; 
  }
  setActiveAccount() {
    console.log('Mock MSAL: setActiveAccount called');
  }
  addEventCallback() { 
    console.log('Mock MSAL: addEventCallback called');
    return 'mock-callback-id'; 
  }
  removeEventCallback() {
    console.log('Mock MSAL: removeEventCallback called');
  }
  async loginRedirect() {
    console.log('Mock MSAL: loginRedirect called');
  }
  async acquireTokenSilent() { 
    console.log('Mock MSAL: acquireTokenSilent called');
    return { accessToken: 'mock-token' }; 
  }
  async logout() {
    console.log('Mock MSAL: logout called');
  }
}

// Use real or mock MSAL instance based on auth setting
export const msalInstance = isAuthDisabled 
  ? new MockPublicClientApplication() as unknown as PublicClientApplication
  : new PublicClientApplication(msalConfig);

// Only initialize real MSAL if auth is enabled
if (!isAuthDisabled) {
  (async () => {
    try {
      // Required in MSAL v4+ before any other API is used
      await msalInstance.initialize();

      const response = await msalInstance.handleRedirectPromise();
      if (response) {
        msalInstance.setActiveAccount(response.account);
        // Persist the token immediately and schedule a refresh so first API calls have auth
        scheduleTokenRefresh(response);
      } else {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);

          // When reloading the app we may already have an account but not a cached API token.
          // Proactively acquire and persist one so data-fetch hooks don't fire unauthenticated requests.
          try {
            const silent = await msalInstance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });
            scheduleTokenRefresh(silent);
          } catch (err) {
            console.warn('Silent token acquisition failed during init', err);
          }
        }
      }

      // Update active account on every login success going forward
      msalInstance.addEventCallback((event: EventMessage) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
          const authResult = event.payload as AuthenticationResult;
          msalInstance.setActiveAccount(authResult.account);
          scheduleTokenRefresh(authResult);
        }
        if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS && event.payload) {
          const authResult = event.payload as AuthenticationResult;
          scheduleTokenRefresh(authResult);
        }
      });
    } catch (error) {
      console.error('MSAL init/redirect error', error);
    }
  })();
}

// Utility to persist token and schedule refresh – defined as a function so it is hoisted
function scheduleTokenRefresh(result: AuthenticationResult) {
  // Save token for axios layer
  localStorage.setItem('access_token', result.accessToken)

  const expires = result.expiresOn?.getTime() ?? 0
  const fiveMinutes = 5 * 60 * 1000
  const timeout = expires - Date.now() - fiveMinutes

  if (timeout > 0) {
    setTimeout(async () => {
      try {
        const refreshed = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: result.account,
        })
        scheduleTokenRefresh(refreshed)
      } catch (err) {
         
        console.warn('Silent refresh failed', err)
      }
    }, timeout)
  }
} 