// eslint-disable-next-line import/no-extraneous-dependencies
import axios, { type InternalAxiosRequestConfig } from 'axios'
import { msalInstance } from '../utils/msalInstance'
import { loginRequest } from '../utils/authConfig'
import { toast } from 'sonner'

const api = axios.create({
  // Use provided environment variable or AgentHive backend
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: false,
})

// Attach auth token if available
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    if (config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`
    } else {
      config.headers = { Authorization: `Bearer ${token}` } as any
    }
  }

  // If no token in storage, attempt to acquire from MSAL silently
  if (!token) {
    try {
      const account = msalInstance.getActiveAccount();
      if (account) {
        const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
        (config.headers as any).Authorization = `Bearer ${result.accessToken}`
      }
    } catch {
      // silent fail
    }
  }

  return config
})

// Response interceptor for errors – toast only for actionable errors
api.interceptors.response.use(
  resp => resp,
  err => {
    const isNetworkError = !err.response;
    const reqUrl: string | undefined = err.config?.url;

    // Suppress toast for background metric polling or network disconnects
    const isMetricsEndpoint = reqUrl?.startsWith('/api/metrics');
    const isLogsEndpoint = reqUrl?.startsWith('/api/logs');

    if (!isNetworkError && !isMetricsEndpoint && !isLogsEndpoint) {
      const message = err.response?.data?.detail || err.message || 'Unexpected error';
      toast.error(message);
    } else {
      // non-intrusive logging for silent/background failures
      console.warn('Background/API error suppressed', err);
    }

    return Promise.reject(err);
  }
)

export default api