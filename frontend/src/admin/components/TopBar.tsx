import React from 'react';
import { AppBar, Toolbar, IconButton, InputBase, Badge, Box, Tooltip, useTheme, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useLocation, matchPath } from 'react-router-dom';
import { ROUTE_TITLES } from '../routeTitles';

// Assuming AuthContext provides a way to get user and toggleTheme is passed from App.tsx via AdminApp -> AdminLayout -> TopBar
// For now, we'll mock these or expect them as props.

interface TopBarProps {
  onSidebarToggle?: () => void; // Optional: only for mobile
  toggleTheme?: () => void; // Passed from App
  isDarkMode?: boolean; // Passed from App
}

const TopBar: React.FC<TopBarProps> = ({ onSidebarToggle, toggleTheme, isDarkMode }) => {
  const theme = useTheme();
  const location = useLocation();

  // Compute page title from current path
  const pageTitle = React.useMemo(() => {
    for (const pattern of Object.keys(ROUTE_TITLES)) {
      if (matchPath({ path: pattern, end: false }, location.pathname)) {
        return ROUTE_TITLES[pattern];
      }
    }
    return '';
  }, [location.pathname]);

  // Mock user for now
  const user = { displayName: 'Admin User' }; 

  // Cmd/Ctrl + K for search - this would ideally be in a global context or App.tsx
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        // Logic to open/focus search input
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
      sx={{
        bgcolor: theme.palette.background.default,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ height: 64, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {pageTitle && (
            <Typography variant="h6" sx={{ mr: 3, fontWeight: 600 }}>
              {pageTitle}
            </Typography>
          )}
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
          {/* Search Input - Basic for now */}
          <Box sx={{
            position: 'relative',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.action.hover,
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            },
            mr: 2,
            width: { xs: '150px', sm: '250px', md: '350px' },
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
              <SearchIcon fontSize="small" />
            </Box>
            <InputBase
              id="admin-search-input"
              placeholder="Search… (⌘K)"
              inputProps={{ 'aria-label': 'search' }}
              sx={{
                color: 'inherit',
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: theme.spacing(1, 1, 1, 0),
                  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                  transition: theme.transitions.create('width'),
                },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {toggleTheme && (
            <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton onClick={toggleTheme} color="inherit" aria-label="toggle theme">
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Notifications">
            <IconButton color="inherit" aria-label="show new notifications">
              <Badge badgeContent={0} color="error"> {/* Mock badge content */}
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          {/* User Avatar/Menu would go here */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar; 