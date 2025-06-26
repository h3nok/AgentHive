import React, { useCallback } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, useTheme, Tooltip, Divider, Typography } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import HiveIcon from '@mui/icons-material/Hive';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';
import HubIcon from '@mui/icons-material/Hub';
import SpeedIcon from '@mui/icons-material/Speed';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LogoText from '../../../shared/components/LogoText';

interface SidebarNavProps {
  isOpen: boolean;
  width: number;
  onToggle: () => void;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { path: '/admin/overview', label: 'Admin Dashboard', icon: <DashboardOutlinedIcon /> },
    ]
  },
  {
    title: 'Enterprise Operations',
    items: [
      { path: '/admin/enterprise-command', label: 'Command Center', icon: <BusinessCenterIcon /> },
      { path: '/admin/workflows', label: 'Workflow Hub', icon: <AutoAwesomeIcon /> },
      { path: '/admin/ai-assistant', label: 'AI Assistant', icon: <ChatIcon /> },
      { path: '/admin/orchestration', label: 'Agent Network', icon: <HubIcon /> },
    ]
  },
  {
    title: 'Technical Administration',
    items: [
      { path: '/admin/swarm', label: 'Agent Swarm', icon: <SmartToyIcon /> },
      { path: '/admin/dashboard', label: 'System Analytics', icon: <SpeedIcon /> },
      { path: '/admin/mpc-servers', label: 'MPC Servers', icon: <DnsOutlinedIcon /> },
      { path: '/admin/plugins', label: 'Extensions', icon: <ExtensionOutlinedIcon /> },
      { path: '/admin/marketplace', label: 'Marketplace', icon: <ShoppingCartOutlinedIcon /> },
    ]
  },
  {
    title: 'Management',
    items: [
      { path: '/admin/users', label: 'User Management', icon: <PeopleAltOutlinedIcon /> },
      { path: '/admin/reports', label: 'Reports', icon: <AssessmentOutlinedIcon /> },
      { path: '/admin/settings', label: 'Settings', icon: <SettingsOutlinedIcon /> },
    ]
  }
];

const SidebarNav: React.FC<SidebarNavProps> = ({ isOpen, width, onToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <Drawer
      variant="permanent"
      open={isOpen}
      sx={{
        width: width,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isOpen ? 'space-between' : 'center',
          px: isOpen ? 2 : 0.5, 
          py: 1.5, 
          height: 64, // Match TopBar height
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {isOpen && (
          <Box 
            sx={{ 
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              '&:hover': { opacity: 0.7 }
            }}
            onClick={handleLogoClick}
          >
            <LogoText size="small" animated={false} interactive={true} />
          </Box>
        )}
        {!isOpen && (
          <Box 
            sx={{ 
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              '&:hover': { opacity: 0.7 }
            }}
            onClick={handleLogoClick}
          >
            <LogoText size="small" showOnlyBubble={true} animated={false} interactive={true} />
          </Box>
        )}
        <Tooltip title={isOpen ? "Collapse sidebar" : "Expand sidebar"} placement="right">
            <IconButton onClick={onToggle} aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}>
            {isOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
        </Tooltip>
      </Box>
      <List sx={{ pt: 2 }}>
        {navSections.map((section, sectionIndex) => (
          <Box key={section.title}>
            {isOpen && sectionIndex > 0 && (
              <Divider sx={{ my: 1, mx: 2 }} />
            )}
            {isOpen && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {section.title}
                </Typography>
              </Box>
            )}
            {section.items.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={isOpen ? '' : item.label} placement="right">
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    aria-label={item.label}
                    sx={{
                      minHeight: 48,
                      justifyContent: isOpen ? 'initial' : 'center',
                      px: 2.5,
                      mb: 0.5,
                      mx: isOpen ? 1 : 'auto',
                      borderRadius: 1,
                      '&.active': {
                        color: theme.palette.primary.main,
                        backgroundColor: theme.palette.action.selected,
                      },
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        color: theme.palette.primary.main,
                      },
                      ...(isOpen && {
                        width: 'calc(100% - 16px)',
                      })
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: isOpen ? 3 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} sx={{ opacity: isOpen ? 1 : 0, color: 'inherit' }} />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </Box>
        ))}
      </List>
    </Drawer>
  );
};

export default SidebarNav; 