// Use a browser-safe fallback for API_BASE_URL
// Try window._env_ (if set by a script), else fallback to localhost
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_.REACT_APP_API_BASE_URL) {
    return (window as any)._env_.REACT_APP_API_BASE_URL;
  }
  return 'http://localhost:8001';
};

export const API_BASE_URL = getApiBaseUrl(); 