import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  InputBase, 
  Badge, 
  Box, 
  Tooltip, 
  useTheme, 
  Typography,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  alpha,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import { ROUTE_TITLES, type RouteInfo } from '../routeTitles';

interface TopBarProps {
  onSidebarToggle?: () => void;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onSidebarToggle, toggleTheme, isDarkMode }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [systemStatus] = React.useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [notifications] = React.useState(3);

  // Compute page info from current path
  const pageInfo = React.useMemo((): RouteInfo | null => {
    for (const pattern of Object.keys(ROUTE_TITLES)) {
      if (matchPath({ path: pattern, end: false }, location.pathname)) {
        return ROUTE_TITLES[pattern];
      }
    }
    return null;
  }, [location.pathname]);

  // Generate breadcrumbs from current path
  const breadcrumbs = React.useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const crumbs = [
      { label: 'AgentHive', path: '/', icon: <HomeIcon sx={{ fontSize: 16 }} /> }
    ];
    
    if (pathSegments.includes('admin')) {
      crumbs.push({ 
        label: 'Admin', 
        path: '/admin', 
        icon: <AccountCircleIcon sx={{ fontSize: 16 }} /> 
      });
      
      const currentPage = pathSegments[pathSegments.length - 1];
      if (pageInfo && currentPage !== 'admin') {
        crumbs.push({ 
          label: pageInfo.title, 
          path: location.pathname,
          icon: <FiberManualRecordIcon sx={{ fontSize: 12 }} />
        });
      }
    }
    
    return crumbs;
  }, [location.pathname, pageInfo]);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const getSystemStatusColor = () => {
    switch (systemStatus) {
      case 'healthy': return '#4ade80';
      case 'warning': return '#fbbf24';
      case 'critical': return '#ef4444';
      default: return '#4ade80';
    }
  };

  // Cmd/Ctrl + K for search
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.getElementById('admin-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <AppBar 
      position="static" 
      elevation={0}
      className="admin-appbar"
      sx={{
        background: 'transparent',
        backdropFilter: 'none',
        borderBottom: 'none',
        boxShadow: 'none',
        color: theme.palette.mode === 'dark' ? 'white' : '#1e293b',
        position: 'relative',
        // Completely invisible background
        '&::before': {
          display: 'none',
        },
        '&::after': {
          display: 'none',
        }
      }}
    >
      {/* Main Toolbar */}
      <Toolbar sx={{ 
        height: 72, 
        justifyContent: 'space-between', 
        px: 3,
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {onSidebarToggle && (
            <IconButton 
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onSidebarToggle}
              sx={{ 
                mr: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Page Title and Status */}
          {pageInfo && (
            <Box sx={{ mr: 4, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    color: theme.palette.mode === 'dark' ? 'white' : '#1e293b',
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    textShadow: theme.palette.mode === 'dark'
                      ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                      : '0 1px 2px rgba(0, 0, 0, 0.1)',
                    letterSpacing: '0.02em'
                  }}
                >
                  {pageInfo.title}
                </Typography>
                {/* System Status Indicator */}
                <Chip
                  icon={<FiberManualRecordIcon sx={{ color: getSystemStatusColor(), fontSize: 12 }} />}
                  label={systemStatus.toUpperCase()}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(0, 0, 0, 0.05)',
                    color: theme.palette.mode === 'dark' ? 'white' : '#1e293b',
                    border: `1px solid ${getSystemStatusColor()}`,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 1px 3px rgba(0, 0, 0, 0.2)'
                      : '0 1px 2px rgba(0, 0, 0, 0.1)',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.85)' 
                      : '#475569',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textShadow: theme.palette.mode === 'dark'
                      ? '0 1px 2px rgba(0, 0, 0, 0.25)'
                      : 'none',
                    letterSpacing: '0.01em'
                  }}
                >
                  {pageInfo.description}
                </Typography>
                {pageInfo.functionCount && (
                  <>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        mx: 0.5,
                        display: { xs: 'none', sm: 'inline' }
                      }}
                    >
                      •
                    </Typography>
                    <Chip 
                      label={`${pageInfo.functionCount} functions`}
                      size="small"
                      sx={{ 
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '& .MuiChip-label': { px: 1.5 },
                        display: { xs: 'none', sm: 'inline-flex' }
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        mx: 0.5,
                        display: { xs: 'none', md: 'inline' }
                      }}
                    >
                      •
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CloudDoneIcon sx={{ fontSize: 14, color: '#4ade80' }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#4ade80',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          display: { xs: 'none', md: 'inline' }
                        }}
                      >
                        Optimized
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* Enhanced Search */}
          <Box sx={{
            position: 'relative',
            borderRadius: 3,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.8)',
            border: theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.25)'
              : '1px solid #cbd5e1',
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 2px 8px rgba(0, 0, 0, 0.15)'
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.9)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.35)'
                : '1px solid #94a3b8',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                : '0 4px 8px rgba(0, 0, 0, 0.12)',
            },
            '&:focus-within': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.25)'
                : 'rgba(255, 255, 255, 0.95)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.45)'
                : `1px solid ${theme.palette.primary.main}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 0 0 2px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.2)'
                : `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}, 0 4px 8px rgba(0, 0, 0, 0.12)`,
            },
            ml: 'auto',
            mr: 3,
            width: { xs: '140px', sm: '200px', md: '280px' },
            transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow']),
          }}>
            <Box sx={{
              padding: theme.spacing(0, 2),
              height: '100%',
              position: 'absolute',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <SearchIcon fontSize="small" sx={{ 
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.8)' 
                  : '#64748b'
              }} />
            </Box>
            <InputBase
              id="admin-search-input"
              placeholder="Search admin functions..."
              inputProps={{ 'aria-label': 'search admin functions' }}
              sx={{
                color: theme.palette.mode === 'dark' ? 'white' : '#1e293b',
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: theme.spacing(1.5, 1, 1.5, 0),
                  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                  transition: theme.transitions.create('width'),
                  fontSize: '0.875rem',
                  '&::placeholder': {
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.7)' 
                      : '#64748b',
                    opacity: 1,
                  }
                },
              }}
            />
            {/* Search shortcut indicator */}
            <Box sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              display: { xs: 'none', sm: 'block' }
            }}>
              <Chip
                label="⌘K"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.15)' 
                    : 'rgba(0, 0, 0, 0.05)',
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.8)' 
                    : '#64748b',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.25)' 
                    : '1px solid #cbd5e1',
                  '& .MuiChip-label': { px: 0.8 }
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Right Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {toggleTheme && (
            <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton 
                onClick={toggleTheme} 
                color="inherit" 
                aria-label="toggle theme"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="System Notifications">
            <IconButton 
              color="inherit" 
              aria-label="show notifications"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Badge badgeContent={notifications} color="error">
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Tooltip title="User Profile">
            <IconButton
              onClick={handleUserMenuOpen}
              color="inherit"
              aria-label="user menu"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease'
              }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Breadcrumb Navigation */}
      <Box      sx={{ 
        px: 3, 
        pb: 1.5, 
        borderTop: 'none',
        background: 'transparent',
        backdropFilter: 'none',
        position: 'relative',
        zIndex: 1,
        // Remove all background effects
        '&::before': {
          display: 'none',
        },
      }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ 
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#475569'
          }} />}
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-ol': {
              alignItems: 'center'
            }
          }}
        >
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={crumb.path}
              color="inherit"
              href={crumb.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(crumb.path);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: theme.palette.mode === 'dark'
                  ? (index === breadcrumbs.length - 1 ? 'white' : 'rgba(255, 255, 255, 0.95)')
                  : (index === breadcrumbs.length - 1 ? '#1e293b' : '#475569'),
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: index === breadcrumbs.length - 1 ? 700 : 600,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: theme.palette.mode === 'dark' ? 'white' : '#1e293b',
                  textDecoration: 'underline',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {crumb.icon}
              {crumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'white',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }
        }}
      >
        <MenuItem onClick={handleUserMenuClose}>
          <AccountCircleIcon sx={{ mr: 1, fontSize: 20 }} />
          Profile Settings
        </MenuItem>
        <MenuItem onClick={handleUserMenuClose}>
          <CloudDoneIcon sx={{ mr: 1, fontSize: 20 }} />
          System Health
        </MenuItem>
        <MenuItem onClick={handleUserMenuClose}>
          <FiberManualRecordIcon sx={{ mr: 1, fontSize: 20, color: getSystemStatusColor() }} />
          Sign Out
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default TopBar;
