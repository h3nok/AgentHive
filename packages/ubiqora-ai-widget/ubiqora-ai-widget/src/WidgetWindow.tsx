import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, useTheme, Fade, Paper, Chip } from '@mui/material';
import { SupportWidget } from './SupportWidget';

export function WidgetWindow(props: { onClose: () => void }) {
  const theme = useTheme();
  const [activeAgents, setActiveAgents] = useState(3);
  const [swarmActivity, setSwarmActivity] = useState('Processing');

  // Simulate dynamic swarm activity
  useEffect(() => {
    const activities = ['Processing', 'Analyzing', 'Collaborating', 'Learning', 'Optimizing'];
    const interval = setInterval(() => {
      setSwarmActivity(activities[Math.floor(Math.random() * activities.length)]);
      setActiveAgents(Math.floor(Math.random() * 5) + 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
          width: { xs: '100vw', sm: 420 },
          height: { xs: '100vh', sm: 680 },
          maxHeight: { xs: '100vh', sm: 'calc(100vh - 120px)' },
          background: theme.palette.mode === 'dark' 
            ? `
              linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%),
              radial-gradient(circle at 20% 80%, rgba(255, 193, 7, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 165, 0, 0.02) 0%, transparent 50%)
            `
            : `
              linear-gradient(145deg, #ffffff 0%, #fefefe 50%, #f8f9fa 100%),
              radial-gradient(circle at 20% 80%, rgba(255, 193, 7, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 165, 0, 0.03) 0%, transparent 50%)
            `,
          borderRadius: { xs: 0, sm: '24px' },
          boxShadow: theme.palette.mode === 'dark'
            ? `
              0 32px 80px rgba(0, 0, 0, 0.6), 
              0 16px 40px rgba(255, 204, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05)
            `
            : `
              0 32px 80px rgba(0, 0, 0, 0.15), 
              0 16px 40px rgba(255, 204, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.8)
            `,
          zIndex: 1300,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: theme.palette.mode === 'dark' 
            ? `2px solid rgba(255, 204, 0, 0.2)` 
            : `2px solid rgba(255, 204, 0, 0.15)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '120px',
            height: '120px',
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="honeycomb" x="0" y="0" width="20" height="17.32" patternUnits="userSpaceOnUse">
                    <polygon points="10,0 20,5.77 20,11.55 10,17.32 0,11.55 0,5.77" 
                             fill="none" 
                             stroke="${theme.palette.mode === 'dark' ? 'rgba(255,204,0,0.08)' : 'rgba(255,204,0,0.05)'}" 
                             stroke-width="0.5"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#honeycomb)"/>
              </svg>
            `)}")`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        {/* Revolutionary Hive Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          p: 2.5,
          background: theme.palette.mode === 'dark'
            ? `
              linear-gradient(135deg, rgba(255, 204, 0, 0.12) 0%, rgba(255, 165, 0, 0.06) 50%, transparent 100%),
              linear-gradient(45deg, rgba(0, 0, 0, 0.4) 0%, rgba(26, 26, 26, 0.8) 100%)
            `
            : `
              linear-gradient(135deg, rgba(255, 204, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 50%, transparent 100%),
              linear-gradient(45deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.95) 100%)
            `,
          backdropFilter: 'blur(20px) saturate(1.2)',
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.15)' : 'rgba(255, 204, 0, 0.1)'}`,
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Top Row: Main Title & Close */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Animated Bee Logo */}
              <Box sx={{
                fontSize: '2rem',
                animation: 'gentleBobbing 3s infinite ease-in-out',
                filter: 'drop-shadow(0 2px 8px rgba(255, 204, 0, 0.4))',
                '@keyframes gentleBobbing': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '50%': { transform: 'translateY(-3px) rotate(2deg)' },
                },
              }}>
                🐝
              </Box>
              
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  AgentHive Collective
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Swarm Intelligence Network
                </Typography>
              </Box>
            </Box>
            
            <IconButton 
              onClick={props.onClose} 
              aria-label="Close hive connection" 
              size="small"
              sx={{
                width: 40,
                height: 40,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)' 
                  : 'linear-gradient(135deg, rgba(255, 204, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 204, 0, 0.15)'}`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(90deg)',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)' 
                    : 'linear-gradient(135deg, rgba(255, 204, 0, 0.15) 0%, rgba(255, 165, 0, 0.08) 100%)',
                  boxShadow: '0 4px 16px rgba(255, 204, 0, 0.3)',
                },
              }}
            >
              <Typography 
                sx={{ 
                  fontSize: 20,
                  color: theme.palette.mode === 'dark' ? '#FFD700' : '#FF8C00',
                  fontWeight: 400,
                  lineHeight: 1,
                }}
              >
                ×
              </Typography>
            </IconButton>
          </Box>

          {/* Bottom Row: Status & Activity Indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Swarm Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                boxShadow: '0 0 12px rgba(76, 175, 80, 0.6)',
                animation: 'swarmPulse 2s infinite ease-in-out',
                '@keyframes swarmPulse': {
                  '0%, 100%': { 
                    transform: 'scale(1)',
                    boxShadow: '0 0 12px rgba(76, 175, 80, 0.6)' 
                  },
                  '50%': { 
                    transform: 'scale(1.2)',
                    boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)' 
                  },
                },
              }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#4CAF50',
                }}
              >
                HIVE ACTIVE
              </Typography>
            </Box>

            {/* Active Agents Counter */}
            <Chip
              label={`${activeAgents} Agents`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.15) 0%, rgba(255, 165, 0, 0.1) 100%)',
                color: theme.palette.mode === 'dark' ? '#FFD700' : '#FF8C00',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.3)' : 'rgba(255, 204, 0, 0.2)'}`,
                '& .MuiChip-label': {
                  paddingX: 1,
                },
              }}
            />

            {/* Current Activity */}
            <Chip
              label={swarmActivity}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(139, 195, 74, 0.1) 100%)',
                color: '#4CAF50',
                border: `1px solid rgba(76, 175, 80, 0.3)`,
                animation: 'activityGlow 3s infinite ease-in-out',
                '& .MuiChip-label': {
                  paddingX: 1,
                },
                '@keyframes activityGlow': {
                  '0%, 100%': { opacity: 0.8 },
                  '50%': { opacity: 1 },
                },
              }}
            />
          </Box>
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

        {/* Futuristic Hive Footer */}
        <Box sx={{
          p: 1.5,
          background: theme.palette.mode === 'dark'
            ? `
              linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%),
              linear-gradient(45deg, rgba(255, 204, 0, 0.05) 0%, transparent 100%)
            `
            : `
              linear-gradient(135deg, rgba(248, 249, 250, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%),
              linear-gradient(45deg, rgba(255, 204, 0, 0.03) 0%, transparent 100%)
            `,
          backdropFilter: 'blur(20px) saturate(1.1)',
          borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.1)' : 'rgba(255, 204, 0, 0.08)'}`,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
            opacity: 0.6,
          },
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              fontWeight: 600,
              letterSpacing: '0.3px',
              background: 'linear-gradient(135deg, #FFB300 0%, #FF8C00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            <Box component="span" sx={{ fontSize: '0.8rem' }}>⚡</Box>
            Powered by AgentHive Neural Swarm
            <Box component="span" sx={{ 
              fontSize: '0.9rem',
              animation: 'sparkle 2s infinite ease-in-out',
              '@keyframes sparkle': {
                '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
                '50%': { opacity: 1, transform: 'scale(1.1)' },
              },
            }}>
              🐝
            </Box>
          </Typography>
        </Box>
      </Paper>
    </Fade>
  );
}
