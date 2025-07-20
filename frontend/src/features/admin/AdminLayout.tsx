import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';

interface AdminLayoutProps {
  children: React.ReactNode;
  toggleTheme?: () => void;
  mode?: 'light' | 'dark';
}

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, toggleTheme, mode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SidebarNav 
        isOpen={isSidebarOpen} 
        width={isSidebarOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH} 
        onToggle={handleSidebarToggle} 
      />
      <Box 
        component="main" 
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: `calc(100% - ${isSidebarOpen && !isMobile ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowY: 'auto',
        }}
      >
        <TopBar 
          onSidebarToggle={isMobile ? handleSidebarToggle : undefined} 
          toggleTheme={toggleTheme} 
          isDarkMode={mode === 'dark'} 
        />
        <Box 
          sx={{ 
            p: { xs: 2, md: 3 }, 
            flexGrow: 1,
            background: theme.palette.mode === 'dark' 
              ? `
                linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%),
                radial-gradient(circle at 20% 20%, rgba(251, 191, 36, 0.02) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(252, 211, 77, 0.015) 0%, transparent 60%)
              `
              : `
                linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%),
                radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.015) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.01) 0%, transparent 60%)
              `,
            minHeight: 'calc(100vh - 120px)',
            overflow: 'auto',
            position: 'relative',
            // 3D depth with inset shadows
            boxShadow: theme.palette.mode === 'dark'
              ? `
                inset 8px 0 16px rgba(0, 0, 0, 0.3),
                inset 0 4px 8px rgba(0, 0, 0, 0.2),
                inset -2px 0 4px rgba(251, 191, 36, 0.05)
              `
              : `
                inset 8px 0 16px rgba(0, 0, 0, 0.08),
                inset 0 4px 8px rgba(0, 0, 0, 0.05),
                inset -2px 0 4px rgba(245, 158, 11, 0.03)
              `,
            // Enhanced scrollbar with 3D effects
            '&::-webkit-scrollbar': {
              width: 12,
            },
            '&::-webkit-scrollbar-track': {
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, rgba(251, 191, 36, 0.05) 50%, rgba(0, 0, 0, 0.2) 100%)'
                : 'linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(245, 158, 11, 0.02) 50%, rgba(0, 0, 0, 0.05) 100%)',
              borderRadius: 6,
              boxShadow: theme.palette.mode === 'dark'
                ? 'inset 0 0 4px rgba(0, 0, 0, 0.3)'
                : 'inset 0 0 4px rgba(0, 0, 0, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.3) 0%, rgba(252, 211, 77, 0.2) 100%)'
                : 'linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.15) 100%)',
              borderRadius: 6,
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(251, 191, 36, 0.2)'
                : '1px solid rgba(245, 158, 11, 0.15)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(251, 191, 36, 0.1)'
                : '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(245, 158, 11, 0.08)',
              '&:hover': {
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.4) 0%, rgba(252, 211, 77, 0.3) 100%)'
                  : 'linear-gradient(180deg, rgba(245, 158, 11, 0.25) 0%, rgba(251, 191, 36, 0.2) 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(251, 191, 36, 0.15)'
                  : '0 4px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(245, 158, 11, 0.12)',
              }
            },
            // 3D perspective for child elements
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
