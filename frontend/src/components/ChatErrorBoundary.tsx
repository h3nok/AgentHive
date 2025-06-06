import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert, AlertTitle } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';

// Declare global gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: Record<string, unknown>) => void;
  }
}

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Enterprise-grade error boundary for chat components
 * Provides graceful error handling with recovery options
 */
class ChatErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error for monitoring
    this.logError(error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to external error tracking service
    this.reportError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    console.group('🚨 Chat Component Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', this.state.errorId);
    console.groupEnd();
  };

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, this would send to error tracking service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
        custom_map: {
          error_id: this.state.errorId,
          component_stack: errorInfo.componentStack,
        },
      });
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
    } else {
      window.location.reload();
    }
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const bugReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2));
    
    // In production, this would open a bug report form
    alert('Error details copied to clipboard. Please include this information when reporting the bug.');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            m: 2,
            borderRadius: 2,
            textAlign: 'center',
            backgroundColor: 'error.lighter',
            border: '1px solid',
            borderColor: 'error.light',
          }}
        >
          <ErrorOutlineIcon 
            sx={{ 
              fontSize: 48, 
              color: 'error.main', 
              mb: 2 
            }} 
          />
          
          <Typography variant="h6" gutterBottom color="error">
            Something went wrong
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We encountered an unexpected error. You can try refreshing or report this issue.
          </Typography>

          {this.props.showDetails && this.state.error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>Error Details</AlertTitle>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
                {this.state.error.message}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Error ID: {this.state.errorId}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              size="small"
            >
              {this.retryCount < this.maxRetries ? 'Try Again' : 'Reload Page'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<BugReportIcon />}
              onClick={this.handleReportBug}
              size="small"
            >
              Report Bug
            </Button>
          </Box>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;
