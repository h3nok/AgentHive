import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import LogoText from '../../shared/components/LogoText';
import {
  Dashboard as DashboardIcon,
  Extension as ConnectorIcon,
  Code as MockStudioIcon,
  Timeline as TraceIcon,
  Security as SecurityIcon,
  Router as ToolBusIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarNavProps {
  isOpen: boolean;
  width: number;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  tooltip?: string;
}

const navItems: NavItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/admin',
    tooltip: 'System Overview & Metrics'
  },
  { 
    id: 'connectors', 
    label: 'Connectors', 
    icon: <ConnectorIcon />, 
    path: '/admin/connectors/marketplace',
    tooltip: 'Integration Marketplace'
  },
  { 
    id: 'tool-bus', 
    label: 'Tool Bus', 
    icon: <ToolBusIcon />, 
    path: '/admin/tool-bus',
    tooltip: 'NATS JetStream Monitoring'
  },
  { 
    id: 'mock-studio', 
    label: 'Mock Studio', 
    icon: <MockStudioIcon />, 
    path: '/admin/mock-studio',
    tooltip: 'API Testing & Mocking'
  },
  { 
    id: 'traces', 
    label: 'Trace Explorer', 
    icon: <TraceIcon />, 
    path: '/admin/traces',
    tooltip: 'Debug Tool Call Flows'
  },
  { 
    id: 'policies', 
    label: 'Security & Policies', 
    icon: <SecurityIcon />, 
    path: '/admin/policies',
    tooltip: 'Governance & Compliance'
  }
];

const SidebarNav: React.FC<SidebarNavProps> = ({ isOpen, width, onToggle }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const drawerContent = (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(10, 10, 10, 0.95) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
        borderRight: theme.palette.mode === 'dark'
          ? '1px solid rgba(251, 191, 36, 0.2)'
          : '1px solid rgba(245, 158, 11, 0.15)',
        // Enhanced inner shadows for depth
        boxShadow: theme.palette.mode === 'dark'
          ? `
            inset -4px 0 8px rgba(0, 0, 0, 0.2),
            inset 0 4px 8px rgba(251, 191, 36, 0.05),
            inset 0 -4px 8px rgba(0, 0, 0, 0.1)
          `
          : `
            inset -4px 0 8px rgba(0, 0, 0, 0.08),
            inset 0 4px 8px rgba(245, 158, 11, 0.03),
            inset 0 -4px 8px rgba(0, 0, 0, 0.05)
          `,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? `
              radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 0% 50%, rgba(252, 211, 77, 0.03) 0%, transparent 60%),
              linear-gradient(180deg, rgba(251, 191, 36, 0.02) 0%, transparent 30%)
            `
            : `
              radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.04) 0%, transparent 50%),
              radial-gradient(circle at 0% 50%, rgba(251, 191, 36, 0.02) 0%, transparent 60%),
              linear-gradient(180deg, rgba(245, 158, 11, 0.015) 0%, transparent 30%)
            `,
          pointerEvents: 'none',
          zIndex: 0,
        },
        '& > *': {
          position: 'relative',
          zIndex: 1,
        },
      }}
    >
      {/* Header with Logo */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isOpen ? 'space-between' : 'center',
          minHeight: 64,
          borderBottom: theme.palette.mode === 'dark'
            ? '1px solid rgba(251, 191, 36, 0.15)'
            : '1px solid rgba(245, 158, 11, 0.1)',
          background: theme.palette.mode === 'dark'
            ? `
              linear-gradient(90deg, rgba(251, 191, 36, 0.08) 0%, transparent 100%),
              linear-gradient(180deg, rgba(252, 211, 77, 0.03) 0%, transparent 100%)
            `
            : `
              linear-gradient(90deg, rgba(245, 158, 11, 0.06) 0%, transparent 100%),
              linear-gradient(180deg, rgba(251, 191, 36, 0.02) 0%, transparent 100%)
            `,
          // Add subtle 3D header shadow
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(251, 191, 36, 0.1)'
            : '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(245, 158, 11, 0.08)',
        }}
      >
        {isOpen && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              '&:hover': {
                '& .logo-container': {
                  transform: 'scale(1.05)',
                },
              },
            }} 
            onClick={() => navigate('/admin')}
          >
            <Box className="logo-container" sx={{ transition: 'transform 0.2s ease' }}>
              <LogoText 
                size="small" 
                animated={false} 
                interactive={true}
                showOnlyBubble={false}
              />
            </Box>
          </Box>
        )}
        {!isOpen && (
          <Box 
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.1)',
              },
              transition: 'transform 0.2s ease',
            }} 
            onClick={() => navigate('/admin')}
          >
            <LogoText 
              size="small" 
              animated={false} 
              interactive={true}
              showOnlyBubble={true}
            />
          </Box>
        )}
        <Tooltip title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'} placement="right">
          <IconButton onClick={onToggle} size="small">
            {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, pt: 1, px: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/admin' && location.pathname.startsWith(item.path));
          
          const navButton = (
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActive}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 48,
                px: isOpen ? 2 : 1.5,
                justifyContent: isOpen ? 'initial' : 'center',
                '&.Mui-selected': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.15) 0%, rgba(252, 211, 77, 0.08) 100%)'
                    : 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.06) 100%)',
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  // Enhanced 3D selected state shadows
                  boxShadow: theme.palette.mode === 'dark'
                    ? `
                      inset 0 0 20px rgba(251, 191, 36, 0.15),
                      inset 3px 0 6px rgba(251, 191, 36, 0.2),
                      2px 0 8px rgba(251, 191, 36, 0.1),
                      0 2px 4px rgba(0, 0, 0, 0.1)
                    `
                    : `
                      inset 0 0 20px rgba(245, 158, 11, 0.12),
                      inset 3px 0 6px rgba(245, 158, 11, 0.15),
                      2px 0 8px rgba(245, 158, 11, 0.08),
                      0 2px 4px rgba(0, 0, 0, 0.05)
                    `,
                  // 3D transform for depth
                  transform: 'translateZ(2px)',
                  position: 'relative',
                  zIndex: 2,
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.2) 0%, rgba(252, 211, 77, 0.12) 100%)'
                      : 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.08) 100%)',
                    transform: 'translateX(4px) translateZ(4px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? `
                        inset 0 0 24px rgba(251, 191, 36, 0.2),
                        inset 4px 0 8px rgba(251, 191, 36, 0.25),
                        4px 0 12px rgba(251, 191, 36, 0.15),
                        0 4px 8px rgba(0, 0, 0, 0.15)
                      `
                      : `
                        inset 0 0 24px rgba(245, 158, 11, 0.15),
                        inset 4px 0 8px rgba(245, 158, 11, 0.2),
                        4px 0 12px rgba(245, 158, 11, 0.12),
                        0 4px 8px rgba(0, 0, 0, 0.08)
                      `,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                    filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))',
                  },
                  '& .MuiListItemText-primary': {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    textShadow: theme.palette.mode === 'dark' 
                      ? '0 1px 2px rgba(251, 191, 36, 0.3)'
                      : '0 1px 2px rgba(245, 158, 11, 0.2)',
                  },
                },
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.08)'
                    : 'rgba(245, 158, 11, 0.06)',
                  transform: 'translateX(2px) translateZ(1px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '1px 0 4px rgba(251, 191, 36, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1)'
                    : '1px 0 4px rgba(245, 158, 11, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)',
                  '& .MuiListItemIcon-root': {
                    transform: 'scale(1.1) translateZ(1px)',
                    filter: theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.25)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                      : 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
                  },
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: 0, 
                  mr: isOpen ? 2 : 'auto', 
                  justifyContent: 'center',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                {item.icon}
              </ListItemIcon>
              {isOpen && (
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }
                  }} 
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.id} disablePadding>
              {!isOpen && item.tooltip ? (
                <Tooltip title={item.tooltip} placement="right" arrow>
                  {navButton}
                </Tooltip>
              ) : (
                navButton
              )}
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box 
        sx={{ 
          p: 2, 
          borderTop: theme.palette.mode === 'dark'
            ? '1px solid rgba(251, 191, 36, 0.15)'
            : '1px solid rgba(245, 158, 11, 0.1)',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.03) 0%, transparent 100%)'
            : 'linear-gradient(90deg, rgba(245, 158, 11, 0.02) 0%, transparent 100%)',
        }}
      >
        {isOpen && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            AgentHive Admin v1.0
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          transition: theme.transitions.create(['width', 'box-shadow'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          // Dramatic 3D shadow system
          boxShadow: theme.palette.mode === 'dark'
            ? `
              8px 0 32px rgba(0, 0, 0, 0.4),
              4px 0 16px rgba(251, 191, 36, 0.15),
              2px 0 8px rgba(251, 191, 36, 0.1),
              16px 0 64px rgba(0, 0, 0, 0.2),
              inset -1px 0 0 rgba(251, 191, 36, 0.1)
            `
            : `
              8px 0 32px rgba(0, 0, 0, 0.15),
              4px 0 16px rgba(245, 158, 11, 0.12),
              2px 0 8px rgba(245, 158, 11, 0.08),
              16px 0 64px rgba(0, 0, 0, 0.08),
              inset -1px 0 0 rgba(245, 158, 11, 0.08)
            `,
          // 3D transform and perspective
          transform: 'translateZ(0)',
          position: 'relative',
          zIndex: theme.zIndex.drawer + 1,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: -8,
            bottom: 0,
            width: 8,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(0, 0, 0, 0.1) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: -1,
          },
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default SidebarNav;
