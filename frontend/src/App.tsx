import React, { Suspense, useEffect, useMemo, useCallback } from 'react';
import { Provider } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles, useMediaQuery } from '@mui/material';
import { Box, LinearProgress, Alert, Snackbar } from '@mui/material';

// Store and state management
import { store, useAppSelector, useAppDispatch, selectTheme, selectError, clearError, setTheme } from './store';

// Error boundaries
import ErrorBoundary, { RouteErrorBoundary } from './components/ErrorBoundary';

// Context providers
import { CanvasProvider } from './context/CanvasContext';
import { EnterpriseFeatureProvider } from './components/EnterpriseFeatureToggle';

// Lazy loaded components for code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const ChatPage = React.lazy(() => import('./components/LayoutShell'));
const AdminPage = React.lazy(() => import('./admin/AdminApp'));
const DebugPage = React.lazy(() => import('./pages/DebugPage'));
const TableRenderingTest = React.lazy(() => import('./components/TableRenderingTest'));
const AgenticChatInterface = React.lazy(() => import('./components/AgenticChatInterface'));
const ChatTestPage = React.lazy(() => import('./pages/ChatTestPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TaskDetailsPage = React.lazy(() => import('./pages/TaskDetailsPage'));

// Global styles for consistent UI
const globalStyles = (
  <GlobalStyles
    styles={(theme) => ({
        ':root': {
          '--red': theme.palette.primary.main,
          '--honey-amber': theme.palette.primary.main,
          '--background-default': theme.palette.background.default,
          '--text-primary': theme.palette.text.primary,
          '--honey-amber-rgb': '245, 158, 11',
        },
      '*': {
        boxSizing: 'border-box',
      },
      html: {
        MozOsxFontSmoothing: 'grayscale',
        WebkitFontSmoothing: 'antialiased',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        width: '100%',
      },
      body: {
        display: 'flex',
        flex: '1 1 100%',
        flexDirection: 'column',
        minHeight: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
      },
      '#root': {
        display: 'flex',
        flex: '1 1 100%',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
      },
      // Custom scrollbar styles
      '*::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '*::-webkit-scrollbar-track': {
        backgroundColor: theme.palette.mode === 'dark' ? '#2b2b2b' : '#f1f1f1',
        borderRadius: '4px',
      },
      '*::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#c1c1c1',
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? '#777' : '#a8a8a8',
        },
      },
      // Focus styles for accessibility
      '*:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '2px',
      },
      // Disable focus outline for mouse users
      '.js-focus-visible :focus:not(.focus-visible)': {
        outline: 'none',
      },
    })}
  />
);

// Loading component
const LoadingFallback: React.FC = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    width: '100vw',
    bgcolor: 'background.default'
  }}>
    <Box sx={{ textAlign: 'center' }}>
      <Box 
        component="img"
        src="/AgentHiveLogo.png"
        alt="AgentHive Logo"
        sx={{ 
          width: 120,
          height: 'auto',
          mb: 2,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.6 },
          },
        }}
      />
    </Box>
  </Box>
);

// Theme configuration
const useAppTheme = () => {
  const themeMode = useAppSelector(selectTheme);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => {
    const mode = themeMode === 'auto' 
      ? (prefersDarkMode ? 'dark' : 'light')
      : themeMode;
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#f59e0b', // honey amber
          light: '#fbbf24', // light amber
          dark: '#d97706', // dark amber
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#C49F55', // goldAmber
          light: '#CE9A6A', // mochaSand
          dark: '#22160F', // darkRoast
          contrastText: '#ffffff',
        },
        background: {
          default: mode === 'dark' ? '#0a0a0a' : '#F6EFDB', // cream for light mode
          paper: mode === 'dark' ? '#1a1a1a' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#ffffff' : '#1a1a1a',
          secondary: mode === 'dark' ? '#b3b3b3' : '#666666',
        },
        divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        // Add custom colors as augmentations (will be handled by theme augmentation)
        error: {
          main: '#d32f2f',
          light: '#ef5350',
          dark: '#c62828',
        },
        warning: {
          main: '#ed6c02',
          light: '#ff9800',
          dark: '#e65100',
        },
        info: {
          main: '#0288d1',
          light: '#03a9f4',
          dark: '#01579b',
        },
        success: {
          main: '#2e7d32',
          light: '#4caf50',
          dark: '#1b5e20',
        },
      },
      typography: {
        fontFamily: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ].join(','),
        h1: {
          fontWeight: 800,
          letterSpacing: '-0.025em',
        },
        h2: {
          fontWeight: 700,
          letterSpacing: '-0.025em',
        },
        h3: {
          fontWeight: 600,
          letterSpacing: '-0.02em',
        },
        h4: {
          fontWeight: 600,
        },
        h5: {
          fontWeight: 500,
        },
        h6: {
          fontWeight: 500,
        },
        button: {
          fontWeight: 600,
          textTransform: 'none',
        },
      },
      shape: {
        borderRadius: 12,
      },
      shadows: [
        'none', // 0
        mode === 'dark' ? '0px 2px 4px rgba(0, 0, 0, 0.3)' : '0px 2px 4px rgba(0, 0, 0, 0.1)', // 1
        mode === 'dark' ? '0px 4px 8px rgba(0, 0, 0, 0.3)' : '0px 4px 8px rgba(0, 0, 0, 0.1)', // 2
        mode === 'dark' ? '0px 8px 16px rgba(0, 0, 0, 0.3)' : '0px 8px 16px rgba(0, 0, 0, 0.1)', // 3
        mode === 'dark' ? '0px 12px 20px rgba(0, 0, 0, 0.3)' : '0px 12px 20px rgba(0, 0, 0, 0.1)', // 4
        mode === 'dark' ? '0px 16px 24px rgba(0, 0, 0, 0.3)' : '0px 16px 24px rgba(0, 0, 0, 0.1)', // 5
        mode === 'dark' ? '0px 20px 28px rgba(0, 0, 0, 0.3)' : '0px 20px 28px rgba(0, 0, 0, 0.1)', // 6
        mode === 'dark' ? '0px 24px 32px rgba(0, 0, 0, 0.3)' : '0px 24px 32px rgba(0, 0, 0, 0.1)', // 7
        mode === 'dark' ? '0px 28px 36px rgba(0, 0, 0, 0.3)' : '0px 28px 36px rgba(0, 0, 0, 0.1)', // 8
        mode === 'dark' ? '0px 32px 40px rgba(0, 0, 0, 0.3)' : '0px 32px 40px rgba(0, 0, 0, 0.1)', // 9
        mode === 'dark' ? '0px 36px 44px rgba(0, 0, 0, 0.3)' : '0px 36px 44px rgba(0, 0, 0, 0.1)', // 10
        mode === 'dark' ? '0px 40px 48px rgba(0, 0, 0, 0.3)' : '0px 40px 48px rgba(0, 0, 0, 0.1)', // 11
        mode === 'dark' ? '0px 44px 52px rgba(0, 0, 0, 0.3)' : '0px 44px 52px rgba(0, 0, 0, 0.1)', // 12
        mode === 'dark' ? '0px 48px 56px rgba(0, 0, 0, 0.3)' : '0px 48px 56px rgba(0, 0, 0, 0.1)', // 13
        mode === 'dark' ? '0px 52px 60px rgba(0, 0, 0, 0.3)' : '0px 52px 60px rgba(0, 0, 0, 0.1)', // 14
        mode === 'dark' ? '0px 56px 64px rgba(0, 0, 0, 0.3)' : '0px 56px 64px rgba(0, 0, 0, 0.1)', // 15
        mode === 'dark' ? '0px 60px 68px rgba(0, 0, 0, 0.3)' : '0px 60px 68px rgba(0, 0, 0, 0.1)', // 16
        mode === 'dark' ? '0px 64px 72px rgba(0, 0, 0, 0.3)' : '0px 64px 72px rgba(0, 0, 0, 0.1)', // 17
        mode === 'dark' ? '0px 68px 76px rgba(0, 0, 0, 0.3)' : '0px 68px 76px rgba(0, 0, 0, 0.1)', // 18
        mode === 'dark' ? '0px 72px 80px rgba(0, 0, 0, 0.3)' : '0px 72px 80px rgba(0, 0, 0, 0.1)', // 19
        mode === 'dark' ? '0px 76px 84px rgba(0, 0, 0, 0.3)' : '0px 76px 84px rgba(0, 0, 0, 0.1)', // 20
        mode === 'dark' ? '0px 80px 88px rgba(0, 0, 0, 0.3)' : '0px 80px 88px rgba(0, 0, 0, 0.1)', // 21
        mode === 'dark' ? '0px 84px 92px rgba(0, 0, 0, 0.3)' : '0px 84px 92px rgba(0, 0, 0, 0.1)', // 22
        mode === 'dark' ? '0px 88px 96px rgba(0, 0, 0, 0.3)' : '0px 88px 96px rgba(0, 0, 0, 0.1)', // 23
        mode === 'dark' ? '0px 92px 100px rgba(0, 0, 0, 0.3)' : '0px 92px 100px rgba(0, 0, 0, 0.1)', // 24
      ],
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              textTransform: 'none',
              fontWeight: 600,
              padding: '8px 24px',
              '&:hover': {
                transform: 'translateY(-1px)',
                transition: 'transform 0.2s ease-in-out',
              },
            },
            contained: {
              boxShadow: mode === 'dark' 
                ? '0 4px 12px rgba(245, 158, 11, 0.3)' 
                : '0 4px 12px rgba(245, 158, 11, 0.2)',
              '&:hover': {
                boxShadow: mode === 'dark' 
                  ? '0 6px 16px rgba(245, 158, 11, 0.4)' 
                  : '0 6px 16px rgba(245, 158, 11, 0.3)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 12,
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 8,
            },
          },
        },
      },
    });
  }, [themeMode, prefersDarkMode]);

  return theme;
};

// App content component
const AppContent: React.FC = () => {
  const theme = useAppTheme();
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectError);
  const currentTheme = useAppSelector(selectTheme);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Resolve auto theme to actual mode
  const resolvedMode = currentTheme === 'auto' 
    ? (prefersDarkMode ? 'dark' : 'light')
    : currentTheme;

  // Theme toggle function
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedMode === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
    localStorage.setItem('theme', newTheme);
  }, [resolvedMode, dispatch]);

  // Performance monitoring
  useEffect(() => {
    console.log('App mounted');
    return () => {
      console.log('App unmounted');
    };
  }, []);

  // Error handling
  const handleCloseError = () => {
    dispatch(clearError());
  };

  // Focus management for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        document.body.classList.add('js-focus-visible');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('js-focus-visible');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <EnterpriseFeatureProvider>
        <CanvasProvider>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            width: '100%',
          }}>
            <RouteErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  {/* Chat without session id (fallback) */}
                  <Route
                    path="/chat"
                    element={
                      <ChatPage
                        toggleTheme={toggleTheme}
                        isNewSession={false}
                      />
                    }
                  />
                  {/* Chat with session id – primary route */}
                  <Route
                    path="/chat/:sessionId"
                    element={
                      <ChatPage
                        toggleTheme={toggleTheme}
                      />
                    }
                  />
                  <Route 
                    path="/admin/*" 
                    element={
                      <AdminPage 
                        toggleTheme={toggleTheme} 
                        mode={resolvedMode} 
                      />
                    } 
                  />
                  <Route 
                    path="/debug" 
                    element={<DebugPage />} 
                  />
                  <Route 
                    path="/test-table" 
                    element={<TableRenderingTest />} 
                  />
                  <Route 
                    path="/agentic-chat" 
                    element={<AgenticChatInterface />} 
                  />
                  <Route 
                    path="/chat-test" 
                    element={<ChatTestPage />} 
                  />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>

            {/* Global error snackbar */}
            <Snackbar
              open={!!error}
              autoHideDuration={6000}
              onClose={handleCloseError}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            </Snackbar>
          </Box>
        </CanvasProvider>
      </EnterpriseFeatureProvider>
    </ThemeProvider>
  );
};

// Main App component with providers
const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
      }}
    >
      <Provider store={store}>
        <AppContent />
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
