import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer,
  Typography,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import LogoText from './LogoText';

// Create a styled Drawer component with Enterprise branding
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    background: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
    borderRight: `1px solid ${theme.palette.divider}`,
    transition: 'width 0.3s ease-in-out',
  }
}));

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

/**
 * Temporary sidebar component that doesn't rely on react-hotkeys-hook
 */
const SidebarTemp: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const theme = useTheme();
  const [width, setWidth] = useState(isCollapsed ? 80 : 280);
  
  // Update width when isCollapsed changes
  useEffect(() => {
    setWidth(isCollapsed ? 80 : 280);
    // Save to localStorage
    localStorage.setItem('drawerCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <StyledDrawer
        variant="permanent"
        anchor="left"
        open={!isCollapsed}
        sx={{
          width: width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: width,
            boxSizing: 'border-box',
            overflowX: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            pt: 2,
            px: isCollapsed ? 1 : 2,
          }}
        >
          {/* Logo area */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              mb: 2,
            }}
          >
            {!isCollapsed && (
              <LogoText size="medium" />
            )}
            {isCollapsed && (
              <LogoText size="small" showOnlyBubble={true} />
            )}
          </Box>

          {/* Empty state message - shown while we fix dependencies */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sidebar is temporarily unavailable
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Resolving package dependencies...
            </Typography>
          </Box>
        </Box>
      </StyledDrawer>

      {/* Toggle button */}
      <Tooltip title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <IconButton
          onClick={() => toggleSidebar()}
          sx={{
            position: 'fixed',
            left: `${width - 15}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            transition: 'left 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            zIndex: 1300,
          }}
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default SidebarTemp;
