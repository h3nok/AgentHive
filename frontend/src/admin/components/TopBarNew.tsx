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
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useLocation, matchPath } from 'react-router-dom';
import { ROUTE_TITLES, type RouteInfo } from '../routeTitles';

interface TopBarProps {
  onSidebarToggle?: () => void;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onSidebarToggle, toggleTheme, isDarkMode }) => {
  const theme = useTheme();
  const location = useLocation();

  // Compute page info from current path
  const pageInfo = React.useMemo((): RouteInfo | null => {
    for (const pattern of Object.keys(ROUTE_TITLES)) {
      if (matchPath({ path: pattern, end: false }, location.pathname)) {
        return ROUTE_TITLES[pattern];
      }
    }
    return null;
  }, [location.pathname]);

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
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ height: 80, justifyContent: 'space-between', px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {onSidebarToggle && (
            <IconButton 
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onSidebarToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Page Title and Description */}
          {pageInfo && (
            <Box sx={{ mr: 4, minWidth: 0 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 0.5,
                  color: 'white',
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                {pageInfo.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                    fontWeight: 500
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
                        height: 22,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '& .MuiChip-label': {
                          px: 1.5
                        },
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
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#4ade80',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        display: { xs: 'none', md: 'inline' }
                      }}
                    >
                      Optimized layout
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* Search Input */}
          <Box sx={{
            position: 'relative',
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:focus-within': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            },
            ml: 'auto',
            mr: 2,
            width: { xs: '120px', sm: '180px', md: '240px' },
            transition: theme.transitions.create(['background-color', 'border-color']),
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
              <SearchIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </Box>
            <InputBase
              id="admin-search-input"
              placeholder="Search… (⌘K)"
              inputProps={{ 'aria-label': 'search' }}
              sx={{
                color: 'white',
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: theme.spacing(1.25, 1, 1.25, 0),
                  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                  transition: theme.transitions.create('width'),
                  fontSize: '0.875rem',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    opacity: 1,
                  }
                },
              }}
            />
          </Box>
        </Box>

        {/* Right side controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {toggleTheme && (
            <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton 
                onClick={toggleTheme} 
                color="inherit" 
                aria-label="toggle theme"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              aria-label="show new notifications"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Badge badgeContent={0} color="error">
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
