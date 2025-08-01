import React, { Suspense, useEffect, useMemo, useCallback } from 'react';
import { Provider } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles, useMediaQuery } from '@mui/material';
import { Box, LinearProgress, Alert, Snackbar } from '@mui/material';

// Store and state management
import { store, useAppSelector, useAppDispatch, setTheme, clearAllErrors } from './shared/store';
import { selectTheme, selectGlobalError } from './shared/store/slices/uiSlice';
import { lightTheme, darkTheme } from './shared/styles/theme';

// Error boundaries
import ErrorBoundary, { RouteErrorBoundary } from './shared/components/ErrorBoundary';

// Context providers
import { EnterpriseFeatureProvider } from './shared/components/EnterpriseFeatureToggle';

// Lazy loaded components for code splitting
const LandingPage = React.lazy(() => import('./app/pages/LandingPage'));
const ChatPage = React.lazy(() => import('./app/layout/LayoutShell'));
const AdminPage = React.lazy(() => import('./core/admin/AdminApp'));
const DashboardPage = React.lazy(() => import('./app/pages/DashboardPage'));
const EnterpriseOSDemo = React.lazy(() => import('./app/pages/EnterpriseOSDemo'));
const AgenticUIPage = React.lazy(() => import('./pages/AgenticUIPage'));

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
        // Add a beautiful honey-themed background
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)'
          : 'linear-gradient(135deg, #fefefe 0%, #fdfbf7 25%, #fcf6e8 50%, #fdf9f0 75%, #ffffff 100%)',
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

// App content component
const AppContent: React.FC = () => {
  const themeMode = useAppSelector(selectTheme);
  const dispatch = useAppDispatch();
  const globalError = useAppSelector(selectGlobalError);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Theme calculation
  const theme = useMemo(() => {
    const mode = themeMode === 'auto' 
      ? (prefersDarkMode ? 'dark' : 'light')
      : themeMode;
    
    return mode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, prefersDarkMode]);

  // Resolve auto theme to actual mode
  const resolvedMode = themeMode === 'auto' 
    ? (prefersDarkMode ? 'dark' : 'light')
    : themeMode;

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
    dispatch(clearAllErrors());
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
                  {/* Task without session id (fallback) */}
                  <Route
                    path="/chat"
                    element={
                      <ChatPage
                        toggleTheme={toggleTheme}
                        isNewSession={false}
                      />
                    }
                  />
                  {/* Task with session id – primary route */}
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

                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/agentic" element={<AgenticUIPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>

            {/* Global error snackbar */}
            <Snackbar
              open={!!globalError}
              autoHideDuration={6000}
              onClose={handleCloseError}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                {globalError}
              </Alert>
            </Snackbar>
          </Box>
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
