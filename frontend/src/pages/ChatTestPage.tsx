import React from 'react';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { useAppSelector, selectTheme } from '../store';
import AgenticChatInterface from '../components/AgenticChatInterface';
import { createTheme } from '@mui/material/styles';

const ChatTestPage: React.FC = () => {
  const themeMode = useAppSelector(selectTheme);
  
  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#6366f1',
        dark: '#4f46e5',
        light: '#818cf8',
      },
      secondary: {
        main: '#ec4899',
        dark: '#db2777',
        light: '#f472b6',
      },
      background: {
        default: themeMode === 'dark' ? '#0f0f23' : '#f8fafc',
        paper: themeMode === 'dark' ? '#1a1a2e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', overflow: 'hidden' }}>
        <AgenticChatInterface />
      </Box>
    </ThemeProvider>
  );
};

export default ChatTestPage;
