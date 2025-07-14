import { useState, useEffect, useCallback, useRef } from 'react';

export interface BackendConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  latency: number | null;
  error: string | null;
  retryCount: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
const HEALTH_CHECK_ENDPOINT = `${API_BASE_URL}/health`;
const PING_INTERVAL = 5000; // 5 seconds
const TIMEOUT_DURATION = 3000; // 3 seconds
const MAX_RETRIES = 3;

export const useBackendConnection = () => {
  const [status, setStatus] = useState<BackendConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    lastConnected: null,
    connectionQuality: 'offline',
    latency: null,
    error: null,
    retryCount: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateConnectionQuality = (latency: number): 'excellent' | 'good' | 'poor' => {
    if (latency < 100) return 'excellent';
    if (latency < 300) return 'good';
    return 'poor';
  };

  const checkConnection = useCallback(async () => {
    // Don't start a new check if already connecting
    if (status.isConnecting) return;

    setStatus(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const startTime = Date.now();

      const response = await fetch(HEALTH_CHECK_ENDPOINT, {
        method: 'GET',
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        ...{ timeout: TIMEOUT_DURATION }
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok) {
        const connectionQuality = calculateConnectionQuality(latency);
        
        setStatus(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          lastConnected: new Date(),
          connectionQuality,
          latency,
          error: null,
          retryCount: 0
        }));
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      // Don't update state if the request was aborted (component unmounting)
      if (error.name === 'AbortError') {
        return;
      }

      const errorMessage = error.message || 'Connection failed';
      
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionQuality: 'offline',
        latency: null,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));

      // Implement exponential backoff for retries
      if (status.retryCount < MAX_RETRIES) {
        const backoffDelay = Math.min(1000 * Math.pow(2, status.retryCount), 30000); // Max 30 seconds
        retryTimeoutRef.current = setTimeout(() => {
          checkConnection();
        }, backoffDelay);
      }
    }
  }, [status.isConnecting, status.retryCount]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setStatus(prev => ({ ...prev, retryCount: 0, error: null }));
    checkConnection();
  }, [checkConnection]);

  // Start connection monitoring
  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up interval for regular checks
    intervalRef.current = setInterval(checkConnection, PING_INTERVAL);

    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkConnection]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      reconnect();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        connectionQuality: 'offline',
        error: 'Network offline'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reconnect]);

  return {
    status,
    reconnect,
    isHealthy: status.isConnected && status.connectionQuality !== 'poor'
  };
};
