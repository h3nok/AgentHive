import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Paper, Alert, AlertTitle, Stack, Chip } from '@mui/material';
import { RefreshRounded, BugReportRounded, HomeRounded } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId?: number;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = this.logError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, children } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when props change (useful for route changes)
    if (hasError && resetOnPropsChange && prevProps.children !== children) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo): string => {
    const eventId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    const errorReport = {
      eventId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }

    // In production, you would send this to your error reporting service
    // e.g., Sentry, LogRocket, Bugsnag, etc.
    this.sendErrorReport(errorReport);

    return eventId;
  };

  private getUserId = (): string | null => {
    // Get user ID from your auth system
    try {
      const user = localStorage.getItem('tsc-autotractor-user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  };

  private sendErrorReport = (errorReport: any) => {
    // In production, send to your error reporting service
    try {
      // Example: Send to API endpoint
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
      
      // For now, store locally for debugging
      const errors = JSON.parse(localStorage.getItem('tsc-autotractor-errors') || '[]');
      errors.push(errorReport);
      localStorage.setItem('tsc-autotractor-errors', JSON.stringify(errors.slice(-10))); // Keep last 10 errors
    } catch (e) {
      console.error('Failed to send error report:', e);
    }
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0,
    });
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState({ retryCount: retryCount + 1 });
      
      // Add delay before retry to prevent rapid retries
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary();
      }, 1000 * (retryCount + 1));
    }
  };

  private handleReloadPage = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, eventId, retryCount } = this.state;
    const { children, fallback, showDetails = false, isolate = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render error UI
      return (
        <Box
          sx={{
            minHeight: isolate ? 200 : '50vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            backgroundColor: isolate ? 'transparent' : 'background.default',
          }}
        >
          <Paper
            elevation={isolate ? 1 : 3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Alert 
              severity="error" 
              sx={{ mb: 3, textAlign: 'left' }}
              icon={<BugReportRounded />}
            >
              <AlertTitle>Something went wrong</AlertTitle>
              {isolate 
                ? 'This component encountered an error and has been isolated to prevent affecting the rest of the application.'
                : 'An unexpected error occurred. Our team has been notified and will investigate this issue.'
              }
              {eventId && (
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`Error ID: ${eventId.substring(0, 8)}`} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>
              )}
            </Alert>

            {showDetails && error && (
              <Box sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  Technical Details
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ p: 2, backgroundColor: 'grey.100' }}
                >
                  <Typography variant="body2" component="pre" sx={{ 
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}>
                    {error.name}: {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
              {retryCount < 3 && (
                <Button
                  variant="contained"
                  startIcon={<RefreshRounded />}
                  onClick={this.handleRetry}
                  disabled={retryCount >= 3}
                >
                  Try Again {retryCount > 0 && `(${retryCount}/3)`}
                </Button>
              )}
              
              {!isolate && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<HomeRounded />}
                    onClick={this.handleGoHome}
                  >
                    Go Home
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={this.handleReloadPage}
                  >
                    Reload Page
                  </Button>
                </>
              )}
            </Stack>

            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Development Mode: Check console for detailed error information
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return children;
  }
}

// HOC for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized error boundaries
export const RouteErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    resetOnPropsChange={true}
    onError={(error, errorInfo) => {
      console.error('Route Error:', error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ 
  children: ReactNode; 
  componentName?: string;
}> = ({ children, componentName }) => (
  <ErrorBoundary 
    isolate={true}
    showDetails={process.env.NODE_ENV === 'development'}
    onError={(error, errorInfo) => {
      console.error(`Component Error in ${componentName}:`, error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary; 