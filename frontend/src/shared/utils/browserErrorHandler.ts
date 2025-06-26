/**
 * Browser Error Handler - Handles browser-specific errors gracefully
 */

/**
 * Initialize browser error handling to filter out irrelevant errors
 */
export const initializeBrowserErrorHandling = () => {
  // Filter out Chrome extension errors that don't affect our app
  const originalError = window.console.error;
  window.console.error = (...args: unknown[]) => {
    const message = args.join(' ');
    
    // Filter out Chrome extension related errors
    const ignoredPatterns = [
      'runtime.lastError',
      'The message port closed before a response was received',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'Could not establish connection. Receiving end does not exist'
    ];
    
    const shouldIgnore = ignoredPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (!shouldIgnore) {
      originalError.apply(console, args);
    }
  };

  // Handle unhandled promise rejections related to extensions
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    
    // Ignore extension-related promise rejections
    if (message.includes('runtime.lastError') || 
        message.includes('Extension context invalidated') ||
        message.includes('The message port closed')) {
      event.preventDefault();
      return;
    }
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    
    // Ignore extension-related errors
    if (message.includes('runtime.lastError') || 
        message.includes('Extension context invalidated') ||
        event.filename?.includes('extension://')) {
      event.preventDefault();
      return;
    }
  });
};

/**
 * Safe API call wrapper that handles common browser API issues
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> => {
  try {
    return await apiCall();
  } catch (error: unknown) {
    const errorObj = error as { message?: string };
    const message = errorObj?.message || '';
    
    // Log only if it's not a browser extension error
    if (!message.includes('runtime.lastError') && 
        !message.includes('Extension context invalidated')) {
      console.error('API call failed:', error);
    }
    
    return fallbackValue;
  }
};
