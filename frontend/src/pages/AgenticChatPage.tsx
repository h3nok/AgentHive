import React from 'react';
import { Box, ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import AgenticChatInterface from '../components/AgenticChatInterface';

const theme = createTheme({
  palette: {
    mode: 'dark',
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
      default: '#0f0f23',
      paper: '#1a1a2e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

const AgenticChatPage: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', overflow: 'hidden' }}>
        <AgenticChatInterface />
      </Box>
    </ThemeProvider>
  );
};

export default AgenticChatPage;
