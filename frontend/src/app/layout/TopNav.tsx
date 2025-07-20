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
  InputBase,
  Fade,
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
  Search as SearchIcon,
  Close as CloseIcon,
  // Agent icons
  SmartToy,
  Code,
  Business,
  Support
} from '@mui/icons-material';
import StatusBadge from '../../shared/components/StatusBadge';
import CommandCenter from '../../core/workflows/CommandCenter';
import { useAppSelector, useAppDispatch, selectTheme, selectUser } from '../../shared/store';
import { setConnectionStatus } from '../../shared/store';
import { useBackendConnection } from '../../shared/hooks/useBackendConnection';
import { useHotkeys } from 'react-hotkeys-hook';
import { useEnterpriseFeatures } from '../../shared/hooks/useEnterpriseFeatures';

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
  // Page context
  pageTitle?: string;
  pageSubtitle?: string;
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
  showSearch = true,
  sidebarCollapsed = false,
  onSidebarToggle,
  // Agent selection props
  selectedAgent,
  onAgentChange,
  agentStatuses = [],
  // Page context props
  pageTitle,
  pageSubtitle,
}) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentTheme = useAppSelector(selectTheme);
  const user = useAppSelector(selectUser);
  const { openSettings } = useEnterpriseFeatures();
  
  // Real backend connection monitoring
  const { status: backendStatus, reconnect } = useBackendConnection();
  
  // Map backend connection status to StatusBadge format
  const connectionStatus = useMemo(() => {
    if (backendStatus.isConnecting) return 'connecting';
    if (backendStatus.isConnected) return 'online';
    return 'offline';
  }, [backendStatus.isConnecting, backendStatus.isConnected]);

  // Update store with real connection status
  useEffect(() => {
    dispatch(setConnectionStatus(connectionStatus));
  }, [dispatch, connectionStatus]);
  
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
        elevation={0} // Remove elevation for cleaner look
        sx={{
          ml: sidebarCollapsed ? '56px' : '240px',
          width: sidebarCollapsed ? 'calc(100% - 56px)' : 'calc(100% - 240px)',
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(25, 25, 25, 0.7)' // More transparent
            : 'rgba(255, 253, 250, 0.7)', // More transparent
          backdropFilter: 'blur(20px)', // Stronger blur for better readability
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`, // Lighter border
          color: theme.palette.text.primary,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none', // Remove shadow for transparent effect
          backgroundImage: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.02) 0%, transparent 100%)' // Lighter gradient
            : 'linear-gradient(135deg, rgba(255, 193, 7, 0.03) 0%, transparent 100%)', // Lighter gradient
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url(" + (theme.palette.mode === 'dark' 
              ? "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l-5.374 5.373 1.414 1.414L56.04 1.414 54.627 0zM.31 54.627l1.414-1.414L0 51.4l-1.414 1.415L.31 54.627zM54.627 60l-1.414-1.414L58.454 55.8 59.87 57.214 54.628 60zM0 8.6l5.373-5.373 1.415 1.415L1.414 10.014 0 8.6zm0 42.8l1.415 1.414L0 54.628l-1.414-1.415L0 51.4zm54.628-42.8l-1.415 1.414L58.454 4.2 59.87 2.786 54.628 0v8.6zM8.6 60l-5.373-5.373-1.414 1.415L8.6 62.828V60zm42.8 0v2.828l6.213-6.213-1.414-1.415L51.4 60h-.001zM5.373 5.373L0 0v8.6l5.373-5.373-1.414-1.414zm49.254 49.254L60 59.999v-8.6l-5.373 5.373 1.414 1.414zM8.6 0h-8.6v8.6h8.6V0zm42.8 0v8.6h8.6V0h-8.6zM0 51.4v8.6h8.6v-8.6H0zm60 0h-8.6v8.6H60v-8.6zM0 0v8.6h8.6V0H0zm51.4 0v8.6H60V0h-8.6zM0 51.4v8.6h8.6v-8.6H0zm60 0h-8.6v8.6H60v-8.6z' fill='%23ffc107' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E"
              : "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l-5.374 5.373 1.414 1.414L56.04 1.414 54.627 0zM.31 54.627l1.414-1.414L0 51.4l-1.414 1.415L.31 54.627zM54.627 60l-1.414-1.414L58.454 55.8 59.87 57.214 54.628 60zM0 8.6l5.373-5.373 1.415 1.415L1.414 10.014 0 8.6zm0 42.8l1.415 1.414L0 54.628l-1.414-1.415L0 51.4zm54.628-42.8l-1.415 1.414L58.454 4.2 59.87 2.786 54.628 0v8.6zM8.6 60l-5.373-5.373-1.414 1.415L8.6 62.828V60zm42.8 0v2.828l6.213-6.213-1.414-1.415L51.4 60h-.001zM5.373 5.373L0 0v8.6l5.373-5.373-1.414-1.414zm49.254 49.254L60 59.999v-8.6l-5.373 5.373 1.414 1.414zM8.6 0h-8.6v8.6h8.6V0zm42.8 0v8.6h8.6V0h-8.6zM0 51.4v8.6h8.6v-8.6H0zm60 0h-8.6v8.6H60v-8.6zM0 0v8.6h8.6V0H0zm51.4 0v8.6H60V0h-8.6zM0 51.4v8.6h8.6v-8.6H0zm60 0h-8.6v8.6H60v-8.6z' fill='%23ff9800' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E") + ")",
            opacity: 0.5,
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

          {/* Agent Selector */}
          {agentStatuses.length > 0 && !isMobile && (
            <TopNavAgentSelector
              selectedAgent={selectedAgent}
              onAgentChange={onAgentChange}
              agentStatuses={agentStatuses}
              compact={isMobile}
            />
          )}

          {/* Center Section - Search & Page Context */}
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            maxWidth: 600,
            mx: 2
          }}>
            {showSearch !== false && !isMobile && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                backdropFilter: 'blur(10px)',
                width: '100%',
                maxWidth: 400,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                '&:focus-within': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  border: `1px solid ${theme.palette.primary.main}`,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                }
              }}>
                <SearchIcon sx={{ 
                  ml: 2, 
                  mr: 1, 
                  color: theme.palette.text.secondary,
                  fontSize: '1.2rem'
                }} />
                <InputBase
                  placeholder="Search dashboards, agents, users..."
                  sx={{
                    flex: 1,
                    py: 1,
                    pr: 2,
                    fontSize: '0.875rem',
                    '& input': {
                      padding: 0,
                      '&::placeholder': {
                        color: theme.palette.text.secondary,
                        opacity: 0.7
                      }
                    }
                  }}
                />
              </Box>
            )}
            
            {/* Page Context - only show if no search or on mobile */}
            {(showSearch === false || isMobile) && pageTitle && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '1rem'
                }}>
                  {pageTitle}
                </Typography>
                {pageSubtitle && (
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem'
                  }}>
                    {pageSubtitle}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Live status indicator on the right */}
            {!isMobile && (
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Backend Connection
                    </Typography>
                    <Typography variant="caption" display="block">
                      Status: {connectionStatus === 'online' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </Typography>
                    {backendStatus.latency && (
                      <Typography variant="caption" display="block">
                        Latency: {backendStatus.latency}ms
                      </Typography>
                    )}
                    {backendStatus.lastConnected && (
                      <Typography variant="caption" display="block">
                        Last connected: {backendStatus.lastConnected.toLocaleTimeString()}
                      </Typography>
                    )}
                    {backendStatus.error && (
                      <Typography variant="caption" display="block" color="error">
                        Error: {backendStatus.error}
                      </Typography>
                    )}
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      Click to reconnect
                    </Typography>
                  </Box>
                }
                placement="bottom"
              >
                <Box sx={{ cursor: 'pointer' }} onClick={reconnect}>
                  <StatusBadge
                    status={connectionStatus}
                    size="small"
                    showLabel={true}
                  />
                </Box>
              </Tooltip>
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