import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Breadcrumbs,
  Link,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

interface TopBarProps {
  onSidebarToggle?: () => void;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const TopBar: React.FC<TopBarProps> = ({ onSidebarToggle, toggleTheme, isDarkMode }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'AgentHive Admin', path: '/admin' }];

    if (pathSegments.length > 1) {
      const section = pathSegments[1];
      switch (section) {
        case 'connectors':
          breadcrumbs.push({ label: 'Connectors', path: '/admin/connectors' });
          break;
        case 'mock-studio':
          breadcrumbs.push({ label: 'Mock Studio', path: '/admin/mock-studio' });
          break;
        case 'traces':
          breadcrumbs.push({ label: 'Trace Explorer', path: '/admin/traces' });
          break;
        case 'policies':
          breadcrumbs.push({ label: 'Security & Policies', path: '/admin/policies' });
          break;
        default:
          breadcrumbs.push({ label: section.charAt(0).toUpperCase() + section.slice(1) });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const isSystemHealthy = true; // This would come from actual system status

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(90deg, rgba(26, 26, 26, 0.98) 0%, rgba(10, 10, 10, 0.95) 100%)'
          : 'linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
        color: theme.palette.text.primary,
        borderBottom: theme.palette.mode === 'dark'
          ? '1px solid rgba(251, 191, 36, 0.15)'
          : '1px solid rgba(245, 158, 11, 0.1)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 24px rgba(251, 191, 36, 0.08)'
          : '0 4px 24px rgba(245, 158, 11, 0.06)',
        zIndex: theme.zIndex.drawer - 1,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.03) 0%, transparent 50%, rgba(252, 211, 77, 0.02) 100%)'
            : 'linear-gradient(90deg, rgba(245, 158, 11, 0.02) 0%, transparent 50%, rgba(251, 191, 36, 0.01) 100%)',
          pointerEvents: 'none',
          zIndex: -1,
        },
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, md: 3 } }}>
        {/* Mobile Menu Button */}
        {onSidebarToggle && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onSidebarToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Breadcrumbs */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ 
              '& .MuiBreadcrumbs-separator': {
                color: theme.palette.text.secondary,
              }
            }}
          >
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                color={index === breadcrumbs.length - 1 ? 'text.primary' : 'text.secondary'}
                href={crumb.path}
                onClick={(e) => {
                  if (crumb.path) {
                    e.preventDefault();
                    navigate(crumb.path);
                  }
                }}
                sx={{
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                  cursor: crumb.path ? 'pointer' : 'default',
                  '&:hover': {
                    textDecoration: crumb.path ? 'underline' : 'none',
                  },
                }}
              >
                {crumb.label}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        {/* System Status Indicator */}
        <Tooltip title={`System Status: ${isSystemHealthy ? 'Healthy' : 'Issues Detected'}`}>
          <Chip
            size="small"
            label={isSystemHealthy ? 'Healthy' : 'Issues'}
            color={isSystemHealthy ? 'success' : 'warning'}
            variant="outlined"
            sx={{ 
              mr: 2, 
              fontSize: '0.75rem',
              background: isSystemHealthy 
                ? (theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(102, 187, 106, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(102, 187, 106, 0.06) 100%)')
                : (theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(252, 211, 77, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.06) 100%)'),
              borderColor: isSystemHealthy ? theme.palette.success.main : theme.palette.primary.main,
              color: isSystemHealthy ? theme.palette.success.main : theme.palette.primary.main,
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: isSystemHealthy
                  ? '0 4px 12px rgba(76, 175, 80, 0.25)'
                  : '0 4px 12px rgba(245, 158, 11, 0.25)',
              },
            }}
          />
        </Tooltip>

        {/* Search Shortcut */}
        <Tooltip title="Search (⌘K)">
          <IconButton
            color="inherit"
            sx={{ mr: 1 }}
            onClick={() => {
              // Implement global search functionality
              console.log('Search triggered');
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>

        {/* Theme Toggle */}
        {toggleTheme && (
          <Tooltip title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}>
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{ 
                mr: 1,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.08)'
                  : 'rgba(245, 158, 11, 0.06)',
                border: theme.palette.mode === 'dark'
                  ? '1px solid rgba(251, 191, 36, 0.2)'
                  : '1px solid rgba(245, 158, 11, 0.15)',
                borderRadius: 2,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(252, 211, 77, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.06) 100%)',
                  transform: 'translateY(-1px) scale(1.05)',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <Tooltip title="Account">
          <IconButton
            color="inherit"
            onClick={handleUserMenuOpen}
            sx={{ 
              p: 0.5,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                fontSize: '0.875rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                border: theme.palette.mode === 'dark'
                  ? '2px solid rgba(251, 191, 36, 0.3)'
                  : '2px solid rgba(245, 158, 11, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              A
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          onClick={handleUserMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 200,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
            },
          }}
        >
          <MenuItem>
            <AccountCircleIcon sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Profile</Typography>
          </MenuItem>
          <MenuItem>
            <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Settings</Typography>
          </MenuItem>
          <Divider />
          <MenuItem sx={{ color: theme.palette.error.main }}>
            <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Logout</Typography>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          onClick={handleNotificationClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 320,
              maxHeight: 400,
            },
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Notifications
            </Typography>
          </Box>
          <MenuItem>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                System Alert
              </Typography>
              <Typography variant="caption" color="text.secondary">
                High memory usage detected on connector-service
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                New Connector Available
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Salesforce CRM connector v2.1 is ready for installation
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Policy Update
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data retention policy has been updated
              </Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
