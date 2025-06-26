import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon,
  SupportAgent as SupportIcon
} from '@mui/icons-material';

interface ChatErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const ChatErrorFallback: React.FC<ChatErrorFallbackProps> = ({ error, resetError }) => {
  const theme = useTheme();

  const handleRefresh = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportBug = () => {
    // In a real app, this would open a bug report form or email
    const subject = encodeURIComponent('Chat Interface Error Report');
    const body = encodeURIComponent(`
Error: ${error.message}
Stack: ${error.stack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `);
    window.open(`mailto:support@agenthive.com?subject=${subject}&body=${body}`);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: 3,
        textAlign: 'center'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.error.dark, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          borderRadius: 3
        }}
      >
        <Box sx={{ mb: 3 }}>
          <BugReportIcon 
            sx={{ 
              fontSize: 64, 
              color: theme.palette.error.main,
              mb: 2
            }} 
          />
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            The chat interface encountered an unexpected error. Don't worry, your data is safe.
          </Typography>
        </Box>

        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            textAlign: 'left',
            '& .MuiAlert-message': {
              fontSize: '0.875rem'
            }
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Technical Details:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            fontFamily: 'monospace', 
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 100,
            overflow: 'auto'
          }}>
            {error.message}
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={resetError}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Try Again
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Go Home
          </Button>
          
          <Button
            variant="text"
            startIcon={<SupportIcon />}
            onClick={handleReportBug}
            sx={{
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Report Issue
          </Button>
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="text.secondary">
            If this problem persists, please contact our support team.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatErrorFallback;
