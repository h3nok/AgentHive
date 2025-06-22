import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
  IconButton,
  alpha,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Divider,
  Fab,
  Fade,
  Container
} from '@mui/material';
import {
  Dashboard,
  BusinessCenter,
  SmartToy,
  AutoAwesome,
  Assessment,
  Settings,
  Speed,
  TrendingUp,
  Group,
  Security,
  Hub,
  Smartphone,
  KeyboardArrowUp,
  FilterList,
  ViewStream,
  Apps,
  Refresh,
  ExpandMore,
  DragIndicator
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../styles/grid-dashboard.css';

interface AdminDashboardCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  category: 'technical' | 'business' | 'hybrid' | 'analytics' | 'security';
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  status: 'active' | 'warning' | 'error' | 'maintenance';
  priority: number; // For sorting in infinite scroll
  size: 'small' | 'medium' | 'large'; // Card size variants
  featured?: boolean; // Featured cards get special treatment
}

interface GridItem {
  id: string;
  data: AdminDashboardCard;
  rowIndex: number;
  columnIndex: number;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

const UnifiedAdminDashboard: React.FC = () => {
  const theme = useTheme();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'dashboard' | 'compact'>('dashboard');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});

  // Update screen width for responsive columns
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive columns
  const getColumnCount = useMemo(() => {
    if (screenWidth < 600) return 1; // Mobile
    if (screenWidth < 900) return 2; // Tablet
    if (screenWidth < 1200) return 3; // Small desktop
    return 4; // Large desktop
  }, [screenWidth]);
  
  // Extended admin sections with more variety for infinite scroll
  const allAdminSections: AdminDashboardCard[] = [
    // Featured/Priority Items
    {
      id: 'enterprise-command',
      title: 'Enterprise Command Center',
      description: 'Executive dashboard for business operations and workflow oversight',
      icon: <Dashboard />,
      route: '/admin/enterprise-command',
      category: 'business',
      metrics: [
        { label: 'Active Workflows', value: 23, trend: 'up' },
        { label: 'Success Rate', value: '98.4%', trend: 'up' },
        { label: 'Cost Savings', value: '$2.3M', trend: 'up' }
      ],
      status: 'active',
      priority: 1,
      size: 'large',
      featured: true
    },
    {
      id: 'system-monitoring',
      title: 'System Health & Monitoring',
      description: 'Real-time system performance, uptime, and resource monitoring',
      icon: <Dashboard />,
      route: '/admin/dashboard',
      category: 'technical',
      metrics: [
        { label: 'Uptime', value: '99.9%', trend: 'stable' },
        { label: 'Response Time', value: '< 200ms', trend: 'up' },
        { label: 'Active Users', value: 1247, trend: 'up' }
      ],
      status: 'active',
      priority: 2,
      size: 'large'
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant Management',
      description: 'Configure and monitor enterprise AI chat and automation',
      icon: <BusinessCenter />,
      route: '/admin/ai-assistant',
      category: 'business',
      metrics: [
        { label: 'Daily Interactions', value: '15.2K', trend: 'up' },
        { label: 'Resolution Rate', value: '94%', trend: 'stable' }
      ],
      status: 'active',
      priority: 3,
      size: 'medium'
    },
    // Core Features
    {
      id: 'workflow-automation',
      title: 'Workflow Automation Hub',
      description: 'Design, deploy, and monitor automated business processes',
      icon: <AutoAwesome />,
      route: '/admin/workflows',
      category: 'business',
      metrics: [
        { label: 'Templates', value: 45, trend: 'up' },
        { label: 'Running', value: 23, trend: 'stable' },
        { label: 'Completed Today', value: 187, trend: 'up' }
      ],
      status: 'active',
      priority: 4,
      size: 'medium'
    },
    {
      id: 'agent-orchestration',
      title: 'Agent Orchestration',
      description: 'Cross-functional agent coordination and workflow integration',
      icon: <Group />,
      route: '/admin/orchestration',
      category: 'technical',
      metrics: [
        { label: 'Orchestrated Tasks', value: 342, trend: 'up' },
        { label: 'Success Rate', value: '96.7%', trend: 'up' },
        { label: 'Avg Response', value: '2.1s', trend: 'up' }
      ],
      status: 'active',
      priority: 5,
      size: 'medium'
    },
    {
      id: 'business-analytics',
      title: 'Business Intelligence & Analytics',
      description: 'Performance metrics, cost analysis, and productivity insights',
      icon: <Assessment />,
      route: '/admin/analytics',
      category: 'analytics',
      metrics: [
        { label: 'ROI', value: '285%', trend: 'up' },
        { label: 'Efficiency Gain', value: '78%', trend: 'up' }
      ],
      status: 'active',
      priority: 6,
      size: 'medium'
    },
    {
      id: 'user-management',
      title: 'User & Access Management',
      description: 'User roles, permissions, and security administration',
      icon: <Security />,
      route: '/admin/users',
      category: 'security',
      metrics: [
        { label: 'Total Users', value: 1247, trend: 'up' },
        { label: 'Active Sessions', value: 834, trend: 'up' },
        { label: 'Security Score', value: '99.2%', trend: 'stable' }
      ],
      status: 'active',
      priority: 7,
      size: 'medium'
    },
    // Performance & Monitoring
    {
      id: 'performance-dashboard',
      title: 'Real-Time Performance Monitor',
      description: 'Live performance, accessibility, and security monitoring',
      icon: <Speed />,
      route: '/admin/performance',
      category: 'technical',
      metrics: [
        { label: 'Performance Score', value: 95, trend: 'up' },
        { label: 'Memory Usage', value: '68%', trend: 'stable' },
        { label: 'Accessibility', value: 98, trend: 'up' }
      ],
      status: 'active',
      priority: 8,
      size: 'small'
    },
    {
      id: 'mobile-optimization',
      title: 'Mobile Optimization Suite',
      description: 'Comprehensive mobile UX analysis and optimization tools',
      icon: <Smartphone />,
      route: '/admin/mobile-optimization',
      category: 'technical',
      metrics: [
        { label: 'Touch Targets', value: '92%', trend: 'up' },
        { label: 'Load Time', value: '1.2s', trend: 'up' },
        { label: 'Mobile Score', value: 94, trend: 'stable' }
      ],
      status: 'active',
      priority: 9,
      size: 'small'
    },
    // Additional sections for infinite scroll
    {
      id: 'swarm-management',
      title: 'Agent Swarm Control',
      description: 'Manage agent deployment, scaling, and orchestration',
      icon: <SmartToy />,
      route: '/admin/swarm',
      category: 'technical',
      metrics: [
        { label: 'Active Agents', value: 47, trend: 'up' },
        { label: 'Idle Agents', value: 5, trend: 'stable' }
      ],
      status: 'active',
      priority: 10,
      size: 'small'
    },
    {
      id: 'plugins-mcp',
      title: 'Plugins & MCP Servers',
      description: 'Plugin marketplace and Model Context Protocol server management',
      icon: <Hub />,
      route: '/admin/plugins',
      category: 'technical',
      metrics: [
        { label: 'Active Plugins', value: 12, trend: 'stable' },
        { label: 'MCP Servers', value: 4, trend: 'stable' }
      ],
      status: 'active',
      priority: 11,
      size: 'small'
    },
    {
      id: 'system-settings',
      title: 'System Configuration',
      description: 'Global settings, integrations, and system preferences',
      icon: <Settings />,
      route: '/admin/settings',
      category: 'technical',
      metrics: [
        { label: 'Integrations', value: 8, trend: 'stable' },
        { label: 'Config Changes', value: 3, trend: 'down' }
      ],
      status: 'active',
      priority: 12,
      size: 'small'
    }
  ];

  // Filtered and sorted sections for infinite scroll
  const filteredSections = useMemo(() => {
    let filtered = allAdminSections;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(section => section.category === filterCategory);
    }
    
    return filtered.sort((a, b) => a.priority - b.priority);
  }, [filterCategory]);

  // Generate intelligent grid layouts with logical positioning
  const generateGridLayouts = useMemo(() => {
    const layouts: { [key: string]: Layout[] } = {
      lg: [], md: [], sm: [], xs: [], xxs: []
    };
    
    // Define intelligent positioning based on importance and workflow
    const layoutStrategy = {
      // Large screens (4 columns) - Strategic placement with expanded heights
      lg: [
        // Top row - Most critical business functions with expanded heights
        { id: 'enterprise-command', x: 0, y: 0, w: 2, h: 4 }, // Featured large - minimal
        { id: 'system-monitoring', x: 2, y: 0, w: 2, h: 4 }, // Featured large - minimal
        
        // Second row - Core operational tools with more space
        { id: 'ai-assistant', x: 0, y: 4, w: 1, h: 4 },
        { id: 'workflow-automation', x: 1, y: 4, w: 1, h: 4 },
        { id: 'agent-orchestration', x: 2, y: 4, w: 1, h: 4 },
        { id: 'business-analytics', x: 3, y: 4, w: 1, h: 4 },
        
        // Third row - Management and security with expanded heights
        { id: 'user-management', x: 0, y: 8, w: 2, h: 4 },
        { id: 'performance-dashboard', x: 2, y: 8, w: 1, h: 4 },
        { id: 'mobile-optimization', x: 3, y: 8, w: 1, h: 4 },
        
        // Bottom row - Support and configuration with more space
        { id: 'swarm-management', x: 2, y: 12, w: 1, h: 4 },
        { id: 'plugins-mcp', x: 3, y: 12, w: 1, h: 4 },
        { id: 'system-settings', x: 0, y: 12, w: 2, h: 4 },
      ],
      
      // Medium screens (3 columns) - Optimized for tablets
      md: [
        { id: 'enterprise-command', x: 0, y: 0, w: 2, h: 4 },
        { id: 'system-monitoring', x: 2, y: 0, w: 1, h: 4 },
        { id: 'ai-assistant', x: 0, y: 4, w: 1, h: 4 },
        { id: 'workflow-automation', x: 1, y: 4, w: 1, h: 4 },
        { id: 'agent-orchestration', x: 2, y: 4, w: 1, h: 4 },
        { id: 'business-analytics', x: 0, y: 8, w: 1, h: 4 },
        { id: 'user-management', x: 1, y: 8, w: 2, h: 4 },
        { id: 'performance-dashboard', x: 0, y: 12, w: 1, h: 4 },
        { id: 'mobile-optimization', x: 1, y: 12, w: 1, h: 4 },
        { id: 'swarm-management', x: 2, y: 12, w: 1, h: 4 },
        { id: 'plugins-mcp', x: 0, y: 16, w: 1, h: 4 },
        { id: 'system-settings', x: 1, y: 16, w: 2, h: 4 },
      ],
      
      // Small screens (2 columns) - Tablet portrait
      sm: [
        { id: 'enterprise-command', x: 0, y: 0, w: 2, h: 4 },
        { id: 'system-monitoring', x: 0, y: 4, w: 2, h: 4 },
        { id: 'ai-assistant', x: 0, y: 8, w: 1, h: 4 },
        { id: 'workflow-automation', x: 1, y: 8, w: 1, h: 4 },
        { id: 'agent-orchestration', x: 0, y: 12, w: 1, h: 4 },
        { id: 'business-analytics', x: 1, y: 12, w: 1, h: 4 },
        { id: 'user-management', x: 0, y: 16, w: 2, h: 4 },
        { id: 'performance-dashboard', x: 0, y: 20, w: 1, h: 4 },
        { id: 'mobile-optimization', x: 1, y: 20, w: 1, h: 4 },
        { id: 'swarm-management', x: 0, y: 24, w: 1, h: 4 },
        { id: 'plugins-mcp', x: 1, y: 24, w: 1, h: 4 },
        { id: 'system-settings', x: 0, y: 28, w: 2, h: 4 },
      ]
    };
    
    // Generate layouts for different screen sizes
    Object.keys(layoutStrategy).forEach(breakpoint => {
      layouts[breakpoint] = layoutStrategy[breakpoint as keyof typeof layoutStrategy].map(item => ({
        i: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: 1,
        minH: 1,
        maxW: breakpoint === 'lg' ? 4 : breakpoint === 'md' ? 3 : 2,
        maxH: 4
      }));
    });
    
    // Mobile layouts (1 column) - stack vertically by priority
    const mobileLayout = filteredSections
      .sort((a, b) => a.priority - b.priority)
      .map((section, index) => ({
        i: section.id,
        x: 0,
        y: index * 4,
        w: 1,
        h: 4,
        minW: 1,
        minH: 4,
        maxW: 1,
        maxH: 4
      }));
    
    layouts.xs = mobileLayout;
    layouts.xxs = mobileLayout;
    
    return layouts;
  }, [filteredSections]);

  // Handle layout changes
  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
  }, []);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'dashboard' | 'compact') => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleFilterChange = (category: string) => {
    setFilterCategory(category);
  };

  const getCategoryColor = (category: AdminDashboardCard['category']) => {
    switch (category) {
      case 'technical':
        return theme.palette.primary.main;
      case 'business':
        return theme.palette.secondary.main;
      case 'hybrid':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status: AdminDashboardCard['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'maintenance':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" sx={{ fontSize: 16 }} />;
      case 'down':
        return <TrendingUp color="error" sx={{ fontSize: 16, transform: 'rotate(180deg)' }} />;
      case 'stable':
        return <TrendingUp color="info" sx={{ fontSize: 16, transform: 'rotate(90deg)' }} />;
      default:
        return null;
    }
  };

  // Category statistics
  const categoryStats = useMemo(() => ({
    technical: allAdminSections.filter(s => s.category === 'technical').length,
    business: allAdminSections.filter(s => s.category === 'business').length,
    analytics: allAdminSections.filter(s => s.category === 'analytics').length,
    security: allAdminSections.filter(s => s.category === 'security').length,
    total: allAdminSections.length
  }), []);

  // Get card height based on size
  const getCardHeight = (size: string) => {
    switch (size) {
      case 'large': return 320;
      case 'medium': return 240;
      case 'small': return 180;
      default: return 240;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
      position: 'relative'
    }}>
      {/* Sticky Header */}
      <Box sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 100,
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        p: 3
      }}>
        {/* View Controls */}
        <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                  }
                }
              }}
            >
              <ToggleButton value="dashboard">
                <Dashboard sx={{ mr: 0.5, fontSize: 16 }} />
                Dashboard
              </ToggleButton>
              <ToggleButton value="compact">
                <Apps sx={{ mr: 0.5, fontSize: 16 }} />
                Compact
              </ToggleButton>
            </ToggleButtonGroup>
            
            <IconButton
              onClick={() => window.location.reload()}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <Refresh />
            </IconButton>
          </Stack>
        </Stack>

        {/* Enhanced Filters and Stats */}
        <Paper 
          elevation={0}
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, rgba(255, 255, 255, 0.95) 100%)`,
            border: theme.palette.mode === 'dark'
              ? `1px solid ${alpha(theme.palette.divider, 0.08)}`
              : `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            borderRadius: 3,
            p: 3,
            backdropFilter: 'blur(15px)',
            boxShadow: theme.palette.mode === 'dark'
              ? 'none'
              : '0 4px 12px rgba(102, 126, 234, 0.08)'
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FilterList sx={{ 
                color: theme.palette.primary.main, 
                fontSize: 20 
              }} />
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  letterSpacing: '0.02em'
                }}
              >
                Filter Categories
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              {[
                { 
                  key: 'all', 
                  label: 'All', 
                  count: categoryStats.total, 
                  icon: '🏢', 
                  color: theme.palette.primary.main,
                  gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                },
                { 
                  key: 'technical', 
                  label: 'Technical', 
                  count: categoryStats.technical, 
                  icon: '⚡', 
                  color: theme.palette.info.main,
                  gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.15)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`
                },
                { 
                  key: 'business', 
                  label: 'Business', 
                  count: categoryStats.business, 
                  icon: '💼', 
                  color: theme.palette.secondary.main,
                  gradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                },
                { 
                  key: 'analytics', 
                  label: 'Analytics', 
                  count: categoryStats.analytics, 
                  icon: '📊', 
                  color: theme.palette.success.main,
                  gradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`
                },
                { 
                  key: 'security', 
                  label: 'Security', 
                  count: categoryStats.security, 
                  icon: '🔒', 
                  color: theme.palette.error.main,
                  gradient: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`
                }
              ].map((category) => (
                <motion.div
                  key={category.key}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Chip
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span style={{ fontSize: '14px' }}>{category.icon}</span>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {category.label}
                        </Typography>
                        <Box
                          sx={{
                            minWidth: 20,
                            height: 20,
                            borderRadius: '10px',
                            bgcolor: filterCategory === category.key 
                              ? theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.9)'
                                : 'rgba(255, 255, 255, 0.95)'
                              : alpha(category.color, theme.palette.mode === 'dark' ? 0.2 : 0.15),
                            color: filterCategory === category.key 
                              ? category.color 
                              : category.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                            boxShadow: theme.palette.mode === 'light' && filterCategory === category.key
                              ? `0 1px 3px ${alpha(category.color, 0.3)}`
                              : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {category.count}
                        </Box>
                      </Stack>
                    }
                    variant={filterCategory === category.key ? 'filled' : 'outlined'}
                    onClick={() => handleFilterChange(category.key)}
                    sx={{
                      cursor: 'pointer',
                      height: 42,
                      px: 2,
                      background: filterCategory === category.key 
                        ? category.gradient
                        : 'transparent',
                      border: `1.5px solid ${alpha(category.color, filterCategory === category.key ? 0.3 : 0.15)}`,
                      color: filterCategory === category.key 
                        ? category.color 
                        : theme.palette.text.primary,
                      boxShadow: theme.palette.mode === 'light' && filterCategory === category.key
                        ? `0 2px 8px ${alpha(category.color, 0.2)}`
                        : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: category.gradient,
                        border: `1.5px solid ${alpha(category.color, 0.4)}`,
                        boxShadow: theme.palette.mode === 'light'
                          ? `0 4px 16px ${alpha(category.color, 0.25)}`
                          : `0 4px 20px ${alpha(category.color, 0.25)}`,
                        transform: 'translateY(-2px)'
                      },
                      '&:active': {
                        transform: 'translateY(0px)'
                      },
                      '& .MuiChip-label': {
                        px: 0
                      }
                    }}
                  />
                </motion.div>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {/* Responsive Grid Layout Content */}
      <Box sx={{ 
        p: 2,
        minHeight: 'calc(100vh - 200px)'
      }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={generateGridLayouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={viewMode === 'compact' ? 60 : 80}
          isDraggable={true}
          isResizable={true}
          margin={viewMode === 'compact' ? [12, 12] : [16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          compactType="vertical"
          preventCollision={false}
          autoSize={true}
        >
          {filteredSections.map((section) => (
            <div key={section.id} className="grid-item">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ height: '100%' }}
              >
                <Card
                  component={Button}
                  onClick={() => window.location.href = section.route}
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left',
                    textTransform: 'none',
                    background: section.featured
                      ? `linear-gradient(135deg, ${alpha(getCategoryColor(section.category), 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
                      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(getCategoryColor(section.category), 0.08)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: section.featured 
                      ? `2px solid ${alpha(getCategoryColor(section.category), 0.3)}`
                      : `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: `0 12px 35px ${alpha(getCategoryColor(section.category), 0.25)}`,
                      border: `2px solid ${alpha(getCategoryColor(section.category), 0.4)}`,
                      transform: 'translateY(-4px)'
                    },
                    '&::before': section.featured ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: `linear-gradient(90deg, ${getCategoryColor(section.category)}, ${alpha(getCategoryColor(section.category), 0.6)})`,
                      zIndex: 1
                    } : {}
                  }}
                >
                  {/* Drag Handle */}
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 2,
                    cursor: 'move',
                    color: alpha(theme.palette.text.secondary, 0.5),
                    '&:hover': {
                      color: theme.palette.text.secondary
                    }
                  }}>
                    <DragIndicator fontSize="small" />
                  </Box>

                  {section.featured && (
                    <Chip
                      label="Featured"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 2,
                        bgcolor: getCategoryColor(section.category),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, p: viewMode === 'compact' ? 1.5 : 2, pt: section.featured ? (viewMode === 'compact' ? 2.5 : 3.5) : (viewMode === 'compact' ? 2 : 3), pl: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={viewMode === 'compact' ? 1 : 2}>
                      <Box sx={{
                        p: viewMode === 'compact' ? 1 : 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(getCategoryColor(section.category), 0.15),
                        color: getCategoryColor(section.category),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {section.icon}
                      </Box>
                      <Chip
                        label={section.status}
                        size="small"
                        color={getStatusColor(section.status)}
                        variant="outlined"
                      />
                    </Stack>

                    <Typography variant={viewMode === 'compact' ? 'subtitle2' : 'h6'} fontWeight="bold" gutterBottom sx={{ 
                      lineHeight: 1.2,
                      mb: viewMode === 'compact' ? 0.5 : 1.5
                    }}>
                      {section.title}
                    </Typography>
                    
                    {viewMode === 'dashboard' && (
                      <Typography variant="body2" color="textSecondary" sx={{ 
                        mb: 2,
                        lineHeight: 1.4
                      }}>
                        {section.description}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} mb={viewMode === 'compact' ? 1 : 2} flexWrap="wrap">
                      <Chip
                        label={section.category}
                        size="small"
                        sx={{
                          bgcolor: alpha(getCategoryColor(section.category), 0.12),
                          color: getCategoryColor(section.category),
                          fontWeight: 'medium'
                        }}
                      />
                      {viewMode === 'dashboard' && (
                        <Chip
                          label={`P${section.priority}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>

                    {section.metrics && viewMode === 'dashboard' && (
                      <Stack spacing={1}>
                        {section.metrics.slice(0, 3).map((metric: any, metricIndex: number) => (
                          <Box key={metricIndex} sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.background.default, 0.6)
                          }}>
                            <Typography variant="caption" color="textSecondary">
                              {metric.label}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" fontWeight="bold">
                                {metric.value}
                              </Typography>
                              {getTrendIcon(metric.trend)}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    )}

                    {section.metrics && viewMode === 'compact' && (
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {section.metrics.slice(0, 2).map((metric: any, metricIndex: number) => (
                          <Box key={metricIndex} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="textSecondary">
                              {metric.label}:
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {metric.value}
                            </Typography>
                            {getTrendIcon(metric.trend)}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ))}
        </ResponsiveGridLayout>
      </Box>

      {/* Scroll to Top FAB */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Fab
              color="primary"
              onClick={scrollToTop}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
                boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <KeyboardArrowUp />
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Box sx={{
        mt: 4,
        p: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="textSecondary">
          Showing {filteredSections.length} admin functions • Drag and resize cards to customize your dashboard
        </Typography>
      </Box>
    </Box>
  );
};

export default UnifiedAdminDashboard;
