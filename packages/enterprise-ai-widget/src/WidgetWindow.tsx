import React from 'react';
import { Box, IconButton, Typography, useTheme, Fade, Paper } from '@mui/material';
import SupportWidget from './SupportWidget';

export function WidgetWindow(props: { onClose: () => void }) {
  const theme = useTheme();

  return (
    <Fade in timeout={300}>
      <Paper
        role="dialog"
        aria-modal="true"
        elevation={24}
        sx={{
          position: 'fixed',
          bottom: { xs: 0, sm: 90 },
          right: { xs: 0, sm: 20 },
          width: { xs: '100vw', sm: 400 },
          height: { xs: '100vh', sm: 650 },
          maxHeight: { xs: '100vh', sm: 'calc(100vh - 120px)' },
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: { xs: 0, sm: 3 },
          boxShadow: theme.palette.mode === 'dark'
            ? '0 24px 64px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(41, 121, 255, 0.15)'
            : '0 24px 64px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(41, 121, 255, 0.08)',
          zIndex: 1300,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(41, 121, 255, 0.15) 0%, rgba(41, 121, 255, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(41, 121, 255, 0.05) 0%, rgba(41, 121, 255, 0.02) 100%)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Status indicator */}
            <Box sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
              boxShadow: '0 0 8px rgba(46, 125, 50, 0.4)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 },
              },
            }} />
            
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  lineHeight: 1.2,
                }}
              >
                Autoprise Assistant
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                Ubiqora AI Support • Online
              </Typography>
            </Box>
          </Box>
          
          <IconButton 
            onClick={props.onClose} 
            aria-label="Close chat" 
            size="small"
            sx={{
              width: 36,
              height: 36,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.08)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <Typography 
              sx={{ 
                fontSize: 18,
                color: theme.palette.text.secondary,
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              ×
            </Typography>
          </IconButton>
        </Box>

        {/* Chat Content */}
        <Box sx={{ 
          flex: 1, 
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <SupportWidget />
        </Box>

        {/* Footer branding */}
        <Box sx={{
          p: 1,
          borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          background: theme.palette.mode === 'dark'
            ? 'rgba(26, 26, 26, 0.8)'
            : 'rgba(248, 249, 250, 0.8)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              textAlign: 'center',
              display: 'block',
              fontWeight: 500,
            }}
          >
            Powered by Ubiqora Autoprise AI | the autonomous future
          </Typography>
        </Box>
      </Paper>
    </Fade>
  );
}
