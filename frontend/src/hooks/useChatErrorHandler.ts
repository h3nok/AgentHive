import { useCallback } from 'react';
import { ErrorInfo } from 'react';

// Declare global gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: Record<string, unknown>) => void;
  }
}

/**
 * Hook for handling chat errors in functional components
 */
export const useChatErrorHandler = () => {
  const handleError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    console.error('Chat Error:', error, errorInfo);
    
    // Report to monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }, []);

  return handleError;
};
