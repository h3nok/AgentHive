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
        <Box sx={{ p: { xs: 2, md: 3 }, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout; 