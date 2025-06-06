/**
 * Custom error types for the chat application
 */

export class MessageNotSentError extends Error {
  constructor(message: string = 'Message could not be sent') {
    super(message);
    this.name = 'MessageNotSentError';
  }
}

export class ApiConnectionError extends Error {
  constructor(message: string = 'Failed to connect to API') {
    super(message);
    this.name = 'ApiConnectionError';
  }
}

export class SessionNotFoundError extends Error {
  constructor(message: string = 'Session not found') {
    super(message);
    this.name = 'SessionNotFoundError';
  }
}

export class StreamingError extends Error {
  constructor(message: string = 'Streaming connection failed') {
    super(message);
    this.name = 'StreamingError';
  }
}

/**
 * Check if an error is network-related
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorObj = error as { message?: string; name?: string; code?: string };
  const message = errorObj.message?.toLowerCase() || '';
  const name = errorObj.name?.toLowerCase() || '';
  
  return (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    name.includes('network') ||
    errorObj.code === 'NETWORK_ERROR'
  );
};

/**
 * Check if an error is extension-related and should be ignored
 */
export const isExtensionError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorObj = error as { message?: string };
  const message = errorObj.message?.toLowerCase() || '';
  
  return (
    message.includes('runtime.lasterror') ||
    message.includes('extension context invalidated') ||
    message.includes('message port closed') ||
    message.includes('chrome-extension') ||
    message.includes('moz-extension')
  );
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (isExtensionError(error)) {
    return 'Browser extension interference detected (this can be safely ignored)';
  }
  
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  if (error instanceof MessageNotSentError) {
    return 'Your message could not be sent. Please try again.';
  }
  
  if (error instanceof ApiConnectionError) {
    return 'Unable to connect to the server. Please ensure the backend is running.';
  }
  
  if (error instanceof SessionNotFoundError) {
    return 'Chat session not found. Please start a new conversation.';
  }
  
  if (error instanceof StreamingError) {
    return 'Connection to the AI service was interrupted. Please try again.';
  }
  
  // Default fallback
  const errorObj = error as { message?: string };
  return errorObj?.message || 'An unexpected error occurred. Please try again.';
};
