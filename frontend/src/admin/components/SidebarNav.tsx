import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, useTheme, Tooltip } from '@mui/material';
import { NavLink } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import LogoText from '../../components/LogoText'; // Assuming LogoText is in src/components

interface SidebarNavProps {
  isOpen: boolean;
  width: number;
  onToggle: () => void;
}

const navItems = [
  { path: '/admin/marketplace', label: 'Marketplace', icon: <ShoppingCartOutlinedIcon /> },
  { path: '/admin/dashboard', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { path: '/admin/agents',    label: 'Agents',    icon: <HubOutlinedIcon /> },
  { path: '/admin/mpc-servers', label: 'MPC Servers', icon: <DnsOutlinedIcon /> },
  { path: '/admin/plugins',   label: 'Plugins',   icon: <ExtensionOutlinedIcon /> },
  { path: '/admin/users',     label: 'User Mgmt', icon: <PeopleAltOutlinedIcon /> },
  { path: '/admin/reports',   label: 'Reports',   icon: <AssessmentOutlinedIcon /> },
  { path: '/admin/settings',  label: 'Settings',  icon: <SettingsOutlinedIcon /> },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ isOpen, width, onToggle }) => {
  const theme = useTheme();

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
          bgcolor: theme.palette.background.paper,
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
        {isOpen && <LogoText size="small" />}
        <Tooltip title={isOpen ? "Collapse sidebar" : "Expand sidebar"} placement="right">
            <IconButton onClick={onToggle} aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}>
            {isOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
        </Tooltip>
      </Box>
      <List sx={{ pt: 2 }}>
        {navItems.map((item) => (
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
      </List>
    </Drawer>
  );
};

export default SidebarNav; 