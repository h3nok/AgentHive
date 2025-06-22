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
  Visibility as ObservabilityIcon,
  Dashboard as DashboardIcon,
  ExpandMore as ExpandMoreIcon,
  Build as CommandCenterIcon,
  // Agent icons
  SmartToy,
  Code,
  Business,
  Support
} from '@mui/icons-material';
import StatusBadge from './StatusBadge';
import CommandCenter from './CommandCenter';
import { useAppSelector, selectTheme, selectUser, selectConnectionStatus } from '../store';
import { useHotkeys } from 'react-hotkeys-hook';
import { useEnterpriseFeatures } from '../hooks/useEnterpriseFeatures';

interface TopNavProps {
  toggleTheme?: () => void;
  showNotifications?: boolean;
  showSearch?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
  // NEW: Agent selection props
  selectedAgent?: string;
  onAgentChange?: (agentId: string) => void;
  agentStatuses?: Array<{
    id: string;
    name: string;
    status: 'ready' | 'thinking' | 'processing' | 'offline';
    confidence: number;
  }>;
}

// Enhanced TopNav AgentSelector Component
const TopNavAgentSelector: React.FC<{
  selectedAgent?: string;
  onAgentChange?: (agentId: string) => void;
  agentStatuses?: Array<{
    id: string;
    name: string;
    status: 'ready' | 'thinking' | 'processing' | 'offline';
    confidence: number;
  }>;
  compact?: boolean;
}> = ({ selectedAgent, onAgentChange, agentStatuses = [], compact = false }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  const currentAgent = useMemo(() => 
    agentStatuses.find(agent => agent.id === selectedAgent) || agentStatuses[0],
    [agentStatuses, selectedAgent]
  );

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleAgentSelect = useCallback((agentId: string) => {
    onAgentChange?.(agentId);
    handleClose();
  }, [onAgentChange, handleClose]);

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'technical': return Code;
      case 'business': return Business;
      case 'support': return Support;
      default: return SmartToy;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10b981';
      case 'thinking': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!currentAgent) return null;

  const IconComponent = getAgentIcon(currentAgent.id);

  return (
    <>
      <Tooltip title="Select Agent">
        <Chip
          icon={<IconComponent sx={{ fontSize: '1.1rem !important' }} />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>{compact ? currentAgent.name.split(' ')[0] : currentAgent.name}</span>
              <Badge
                badgeContent=""
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: getStatusColor(currentAgent.status),
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    minWidth: 8,
                    border: `1px solid ${theme.palette.background.paper}`,
                  }
                }}
              />
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
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            fontWeight: 500,
            pr: 0.5,
          }}
        />
      </Tooltip>
      
      <Portal>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              minWidth: 280,
              mt: 1.5,
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha('#1a1a1a', 0.95)
                : alpha('#fff', 0.95),
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              borderRadius: 2,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Available Agents ({agentStatuses.length})
            </Typography>
          </Box>
          
          {agentStatuses.map((agent) => {
            const AgentIcon = getAgentIcon(agent.id);
            return (
              <MenuItem
                key={agent.id}
                onClick={() => handleAgentSelect(agent.id)}
                selected={agent.id === currentAgent.id}
                sx={{ 
                  minHeight: 48,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon>
                  <Badge
                    badgeContent=""
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: getStatusColor(agent.status),
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        minWidth: 8,
                        border: `1px solid ${theme.palette.background.paper}`,
                      }
                    }}
                  >
                    <AgentIcon />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={agent.name}
                  secondary={`${agent.status} • ${agent.confidence}% confidence`}
                />
              </MenuItem>
            );
          })}
        </Menu>
      </Portal>
    </>
  );
};


// Enhanced TopNav Component  
const TopNav: React.FC<TopNavProps> = ({
  toggleTheme,
  showNotifications = true,
  sidebarCollapsed = false,
  onSidebarToggle,
  // Agent selection props
  selectedAgent,
  onAgentChange,
  agentStatuses = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentTheme = useAppSelector(selectTheme);
  const user = useAppSelector(selectUser);
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const { openSettings } = useEnterpriseFeatures();
  
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);

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

  const handleCommandCenterOpen = useCallback(() => {
    setCommandCenterOpen(true);
  }, []);

  const handleCommandCenterClose = useCallback(() => {
    setCommandCenterOpen(false);
  }, []);

  const handleWorkflowAction = useCallback((action: string, workflowId?: string) => {
    console.log('Workflow action:', action, workflowId);
    // Implement workflow actions here
  }, []);


  
  // Add keyboard shortcut for Observability
  useHotkeys('cmd+o, ctrl+o', () => {
    handleObservabilityClick();
  }, { preventDefault: true });

  // Add keyboard shortcut for Command Center
  useHotkeys('cmd+k, ctrl+k', () => {
    handleCommandCenterOpen();
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
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(45, 45, 45, 0.85)' 
              : 'rgba(255, 255, 255, 0.85)',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
          },
          // Add subtle gradient background for agentic theme
          background: scrolled ? undefined : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
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

          {/* Agent Selector */}
          {agentStatuses.length > 0 && !isMobile && (
            <TopNavAgentSelector
              selectedAgent={selectedAgent}
              onAgentChange={onAgentChange}
              agentStatuses={agentStatuses}
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
              {/* Command Center Button */}
              {!isMobile && (
                <Tooltip title="Command Center (⌘K)">
                  <Button
                    startIcon={<CommandCenterIcon />}
                    onClick={handleCommandCenterOpen}
                    size="small"
                    variant="text"
                    sx={{
                      color: theme.palette.text.primary,
                      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main },
                      transition: 'all 0.2s ease',
                      fontWeight: 600,
                    }}
                  >Command</Button>
                </Tooltip>
              )}
              
              {/* Observability Button */}
              {!isMobile && (
                <Tooltip title="Analytics Hub (⌘O)">
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
                  >Analytics</Button>
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
            {agentStatuses.length > 0 && (
              <MenuItem onClick={handleMoreMenuClose}>
                <ListItemIcon><SmartToy fontSize="small" /></ListItemIcon>
                <ListItemText>Select Agent</ListItemText>
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

            <MenuItem onClick={() => { handleCommandCenterOpen(); handleMoreMenuClose(); }}>
              <ListItemIcon><CommandCenterIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Command Center</ListItemText>
            </MenuItem>

            <MenuItem onClick={() => { handleObservabilityClick(); handleMoreMenuClose(); }}>
              <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Analytics</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Command Center Dialog */}
      <CommandCenter
        open={commandCenterOpen}
        onClose={handleCommandCenterClose}
        onWorkflowAction={handleWorkflowAction}
        onSidebarToggle={onSidebarToggle}
      />
    </>
  );
};

export default TopNav;