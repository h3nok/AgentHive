import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  ListItemIcon,
  ListItemText,
  alpha,
  Badge,
  Portal,
} from '@mui/material';
import {
  DarkMode as MoonIcon,
  LightMode as SunIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Help as HelpIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreIcon,
  SmartToy as AIIcon,
  Visibility as ObservabilityIcon,
  Dashboard as DashboardIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import StatusBadge from './StatusBadge';
import { useAppSelector, selectTheme, selectUser, selectConnectionStatus } from '../store';
import { useHotkeys } from 'react-hotkeys-hook';
import { useEnterpriseFeatures } from '../hooks/useEnterpriseFeatures';

interface TopNavProps {
  toggleTheme?: () => void;
  onModelChange?: (modelId: string) => void;
  selectedModel?: string;
  showModelSelector?: boolean;
  showNotifications?: boolean;
  showSearch?: boolean;
  sidebarCollapsed?: boolean;
}

// Mock deployment data - replace with actual API call
const mockDeployments = [
  {
    id: "gpt-4-deployment",
    name: "GPT-4",
    deployment: "Inspyro-GPT4",
    status: "healthy",
    region: "East US",
    version: "1106-Preview"
  },
  {
    id: "gpt-35-deployment", 
    name: "GPT-3.5 Turbo",
    deployment: "Inspyro3-mini",
    status: "healthy",
    region: "East US",
    version: "0125"
  },
  {
    id: "gpt-4-turbo-deployment",
    name: "GPT-4 Turbo",
    deployment: "Inspyro-GPT4-Turbo",
    status: "degraded",
    region: "West US",
    version: "1106-Preview"
  }
];

// Enhanced Model/Deployment Selector Component
const DeploymentSelector: React.FC<{
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  compact?: boolean;
}> = ({ selectedModel, onModelChange, compact = false }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  const currentDeployment = useMemo(() => 
    mockDeployments.find(dep => dep.id === selectedModel) || mockDeployments[0],
    [selectedModel]
  );

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDeploymentSelect = useCallback((deploymentId: string) => {
    onModelChange?.(deploymentId);
    handleClose();
  }, [onModelChange, handleClose]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4caf50';
      case 'degraded': return '#ff9800';
      case 'unhealthy': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  // Add keyboard shortcut for model selector
  useHotkeys('cmd+/, ctrl+/', () => {
    if (!anchorEl) {
      const button = document.querySelector('[data-model-selector-trigger]') as HTMLElement;
      button?.click();
    }
  }, { preventDefault: true });

  return (
    <>
      <Tooltip title="Select AI Model (⌘/)">
        <Chip
          data-model-selector-trigger
          icon={<AIIcon sx={{ fontSize: '1.1rem !important' }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>{compact ? currentDeployment.name.split(' ')[0] : currentDeployment.deployment}</span>
              <ExpandMoreIcon 
                sx={{ 
                  fontSize: '1rem', 
                  opacity: 0.7,
                  transition: 'transform 0.2s ease',
                  transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                }} 
              />
            </Box>
          }
          onClick={handleClick}
          size="small"
          variant="outlined"
          sx={{
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#000', 0.3)
              : alpha('#fff', 0.6),
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha('#fff', 0.05)
                : alpha('#000', 0.05),
              borderColor: alpha(theme.palette.primary.main, 0.3),
              transform: 'translateY(-1px)',
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            fontWeight: 500,
            pr: 0.5,
          }}
        />
      </Tooltip>
      
      {/* Portal the menu to body to avoid z-index issues */}
      <Portal>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          TransitionProps={{
            style: { transformOrigin: 'top center' }
          }}
          PaperProps={{
            elevation: 8,
            sx: {
              minWidth: 320,
              maxHeight: 400,
              mt: 1.5,
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha('#1a1a1a', 0.95)
                : alpha('#fff', 0.95),
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              borderRadius: 2,
              overflow: 'hidden',
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                transition: 'all 0.2s ease',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Available Models ({mockDeployments.length})
            </Typography>
          </Box>
          
          <Box sx={{ py: 0.5 }}>
            {mockDeployments.map((deployment) => (
              <MenuItem
                key={deployment.id}
                onClick={() => handleDeploymentSelect(deployment.id)}
                selected={deployment.id === currentDeployment.id}
                sx={{ 
                  minHeight: 64,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <Badge
                    badgeContent=""
                    color={deployment.status === 'healthy' ? 'success' : 
                           deployment.status === 'degraded' ? 'warning' : 'error'}
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: getStatusColor(deployment.status),
                        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                      }
                    }}
                  >
                    <AIIcon />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {deployment.name}
                      </Typography>
                      <Chip 
                        label={deployment.status.toUpperCase()} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.65rem',
                          backgroundColor: alpha(getStatusColor(deployment.status), 0.15),
                          color: getStatusColor(deployment.status),
                          fontWeight: 700,
                          border: 'none',
                        }} 
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      <strong>Deployment:</strong> {deployment.deployment}
                      <br />
                      <strong>Region:</strong> {deployment.region} • <strong>Version:</strong> {deployment.version}
                    </Typography>
                  }
                />
              </MenuItem>
            ))}
          </Box>
        </Menu>
      </Portal>
    </>
  );
};



// Enhanced TopNav Component
const TopNav: React.FC<Omit<TopNavProps,'onSidebarToggle'>> = ({
  toggleTheme,
  onModelChange,
  selectedModel,
  showModelSelector = true,
  showNotifications = true,
  sidebarCollapsed = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentTheme = useAppSelector(selectTheme);
  const user = useAppSelector(selectUser);
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const { openSettings } = useEnterpriseFeatures();
  
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  /* ------------------------------------------------------------- */
  /* Scroll blur handling – add 'scrolled' class after 16px scroll */
  /* ------------------------------------------------------------- */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUserMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setUserMenuAnchor(null);
  }, []);

  const handleMoreMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  }, []);

  const handleMoreMenuClose = useCallback(() => {
    setMoreMenuAnchor(null);
  }, []);

  const handleLogout = useCallback(() => {
    // Implement logout logic
    handleUserMenuClose();
  }, [handleUserMenuClose]);

  const handleObservabilityClick = useCallback(() => {
    // Navigate to existing admin dashboard
    window.open('/admin/dashboard', '_blank');
  }, []);
  
  // Add keyboard shortcut for Observability
  useHotkeys('cmd+o, ctrl+o', () => {
    handleObservabilityClick();
  }, { preventDefault: true });

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        className={scrolled ? 'scrolled' : undefined}
        sx={{
          ml: sidebarCollapsed ? '56px' : '240px',
          width: sidebarCollapsed ? 'calc(100% - 56px)' : 'calc(100% - 240px)',
          bgcolor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderBottom: 'none',
          color: theme.palette.mode === 'dark' ? '#ECECEC' : '#1F1F1F',
          transition: 'backdrop-filter .2s, background-color .2s',
          '&.scrolled': {
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          },
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: 56, sm: 64 }, 
          px: { xs: 1, sm: 2 },
          display: 'grid',
          gridTemplateColumns: 'auto auto auto 1fr auto',
          gap: { xs: 1, sm: 2 },
          alignItems: 'center',
        }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
            {/* Logo removed from TopNav; icon remains in sidebar */}
          </Box>

          {/* Model/Deployment Selector */}
          {showModelSelector && !isMobile && (
            <DeploymentSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              compact={isMobile}
            />
          )}

          {/* Center Section - Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Live status indicator on the right */}
            {!isMobile && (
              <StatusBadge
                status={connectionStatus}
                size="small"
                showLabel={true}
              />
            )}

            {/* Push remaining controls to far right */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
              {/* Observability Button */}
              {!isMobile && (
                <Tooltip title="Autoprise Hub (⌘O)">
                  <Button
                    startIcon={<ObservabilityIcon />}
                    onClick={handleObservabilityClick}
                    size="small"
                    variant="text"
                    sx={{
                      color: theme.palette.text.primary,
                      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main },
                      transition: 'all 0.2s ease',
                      fontWeight: 600,
                    }}
                  >Hub</Button>
                </Tooltip>
              )}

              {/* Theme Toggle */}
              {toggleTheme && (
                <Tooltip title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}> 
                  <IconButton onClick={toggleTheme} size="small" sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1), transform: 'scale(1.05)' }, transition: 'all 0.2s ease' }}>
                    {currentTheme === 'light' ? <MoonIcon /> : <SunIcon />}
                  </IconButton>
                </Tooltip>
              )}

              {/* Settings */}
              <Tooltip title="Settings">
                <IconButton onClick={openSettings} size="small" sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1), transform: 'scale(1.05)' }, transition: 'all 0.2s ease' }}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              {/* User Menu */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {user && !isMobile && (
                  <Box sx={{ textAlign: 'right', mr: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                      {user.role}
                    </Typography>
                  </Box>
                )}
                <Tooltip title="Account">
                  <IconButton onClick={handleUserMenuOpen} size="small" sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}>
                    {user ? <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.875rem' }}>{user.name?.charAt(0).toUpperCase() || 'U'}</Avatar> : <AccountIcon />}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Mobile More Menu */}
              {isMobile && <IconButton onClick={handleMoreMenuOpen} size="small"><MoreIcon /></IconButton>}
            </Box>
          </Box>

          {/* User Menu */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                backgroundColor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  '& .MuiMenuItem-root': {
                    borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                },
              },
            }}
          >
            {user && (
              <>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2">{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
              </Typography>
                  <Chip 
                    label={user.role} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    sx={{ mt: 0.5, height: 18, fontSize: '0.7rem' }}
                  />
                </Box>
                <Divider />
              </>
            )}
            
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon><HelpIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Help & Support</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Sign Out</ListItemText>
            </MenuItem>
          </Menu>
          
          {/* Mobile More Menu */}
          <Menu
            anchorEl={moreMenuAnchor}
            open={Boolean(moreMenuAnchor)}
            onClose={handleMoreMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                backgroundColor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              },
            }}
          >
            {showModelSelector && (
              <MenuItem onClick={handleMoreMenuClose}>
                <ListItemIcon><AIIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Select Model</ListItemText>
              </MenuItem>
            )}
            
            {showNotifications && (
              <MenuItem onClick={handleMoreMenuClose}>
              <ListItemIcon>
                  <Badge badgeContent={3} color="primary" variant="dot">
                    <NotificationsIcon fontSize="small" />
                  </Badge>
              </ListItemIcon>
                <ListItemText>Notifications</ListItemText>
              </MenuItem>
            )}

            <MenuItem onClick={() => { handleObservabilityClick(); handleMoreMenuClose(); }}>
              <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Observability</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default TopNav;