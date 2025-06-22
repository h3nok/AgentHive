import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  IconButton,
  Typography,
  Chip,
  Divider,
  Stack,
  Tooltip,
  alpha,
  useTheme,
  Badge,
  LinearProgress,
  Avatar,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Paper,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Dashboard,
  SmartToy,
  AutoAwesome,
  Hub,
  Assessment,
  Settings,
  Chat,
  Schedule,
  ExpandLess,
  ExpandMore,
  Memory,
  Speed,
  Psychology,
  Engineering,
  Star,
  StarBorder,
  Visibility,
  VisibilityOff,
  History,
  Bookmark,
  KeyboardArrowDown,
  KeyboardArrowUp,
  PushPin,
  UnfoldLess,
  UnfoldMore,
  Search,
  FilterList,
  MoreVert,
  Keyboard,
  FlashOn,
  TrendingUp,
  NetworkCheck,
  Security,
  Group,
  BarChart,
  Code,
  BookmarkBorder
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  description: string;
  badge?: number;
  isPinned?: boolean;
  category: 'core' | 'tools' | 'analysis' | 'admin';
  usage?: 'high' | 'medium' | 'low';
  lastUsed?: Date;
  keywords?: string[];
}

interface QuickActionTemplate {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  category: string;
  description: string;
  action: () => void;
}

interface OptimizedSidebarProps {
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeView: string;
  navigationItems: NavigationItem[];
  onViewChange: (viewId: string) => void;
  theme: any;
  isMobile?: boolean;
  onSidebarClose?: () => void;
}

const OptimizedSidebar: React.FC<OptimizedSidebarProps> = ({
  sidebarOpen,
  sidebarWidth,
  activeView,
  navigationItems,
  onViewChange,
  theme,
  isMobile = false,
  onSidebarClose
}) => {
  // State management for sidebar optimization
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'connected-tools': true,
    'performance': true,
    'admin-tools': true
  });
  
  const [pinnedItems, setPinnedItems] = useState<string[]>(['command-center', 'chat-interface', 'workflows']);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [hideAgentContext, setHideAgentContext] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Memory context state
  const [memoryUsage, setMemoryUsage] = useState(45);
  const [conversationCount, setConversationCount] = useState(12);

  // Quick action templates for common requests
  const quickActionTemplates: QuickActionTemplate[] = [
    {
      id: 'new-workflow',
      label: 'New Workflow',
      icon: <AutoAwesome />,
      shortcut: 'Ctrl+N',
      category: 'Workflow',
      description: 'Create a new automated workflow',
      action: () => onViewChange('workflows')
    },
    {
      id: 'quick-chat',
      label: 'Quick Ask',
      icon: <Chat />,
      shortcut: 'Ctrl+K',
      category: 'AI',
      description: 'Start a conversation with AI assistant',
      action: () => onViewChange('chat-interface')
    },
    {
      id: 'system-status',
      label: 'System Health',
      icon: <Speed />,
      shortcut: 'Ctrl+H',
      category: 'Monitoring',
      description: 'View system health and performance',
      action: () => onViewChange('command-center')
    },
    {
      id: 'time-off',
      label: 'Time Off Request',
      icon: <Schedule />,
      shortcut: 'Ctrl+T',
      category: 'HR',
      description: 'Quick time off request',
      action: () => onViewChange('time-off-demo')
    },
    {
      id: 'analytics',
      label: 'Generate Report',
      icon: <BarChart />,
      shortcut: 'Ctrl+R',
      category: 'Analytics',
      description: 'Generate performance analytics',
      action: () => onViewChange('analytics')
    },
    {
      id: 'agents',
      label: 'Agent Network',
      icon: <Hub />,
      shortcut: 'Ctrl+A',
      category: 'Network',
      description: 'View agent collaboration network',
      action: () => onViewChange('orchestration')
    }
  ];

  // Recent sessions with better session management
  const [recentSessions, setRecentSessions] = useState([
    { 
      id: '1', 
      title: 'Workflow Automation Setup', 
      time: '2 hours ago', 
      active: true,
      category: 'Workflow',
      agentType: 'Workflow Orchestrator',
      messageCount: 24
    },
    { 
      id: '2', 
      title: 'Employee Onboarding Process', 
      time: '1 day ago', 
      active: false,
      category: 'HR',
      agentType: 'HR Specialist',
      messageCount: 18
    },
    { 
      id: '3', 
      title: 'Budget Analysis Review', 
      time: '2 days ago', 
      active: false,
      category: 'Finance',
      agentType: 'Finance Analyst',
      messageCount: 31
    }
  ]);

  // Organize navigation items by usage and category
  const organizedSections = React.useMemo(() => {
    const pinned = navigationItems.filter(item => pinnedItems.includes(item.id));
    const core = navigationItems.filter(item => 
      item.category === 'core' && !pinnedItems.includes(item.id)
    );
    const tools = navigationItems.filter(item => 
      item.category === 'tools' && !pinnedItems.includes(item.id)
    );
    const analysis = navigationItems.filter(item => 
      item.category === 'analysis' && !pinnedItems.includes(item.id)
    );
    const admin = navigationItems.filter(item => 
      item.category === 'admin' && !pinnedItems.includes(item.id)
    );

    return [
      {
        id: 'pinned',
        title: 'Pinned',
        icon: <PushPin />,
        items: pinned,
        isCollapsed: false,
        usage: 'high' as const,
        canCollapse: false
      },
      {
        id: 'core-functions',
        title: 'Core Functions',
        icon: <Dashboard />,
        items: core,
        isCollapsed: false,
        usage: 'high' as const,
        canCollapse: true
      },
      {
        id: 'connected-tools',
        title: 'Connected Tools',
        icon: <Engineering />,
        items: tools,
        isCollapsed: collapsedSections['connected-tools'] || false,
        usage: 'medium' as const,
        canCollapse: true
      },
      {
        id: 'performance',
        title: 'Performance & Analysis',
        icon: <Assessment />,
        items: analysis,
        isCollapsed: collapsedSections['performance'] || false,
        usage: 'medium' as const,
        canCollapse: true
      },
      {
        id: 'admin-tools',
        title: 'Administration',
        icon: <Settings />,
        items: admin,
        isCollapsed: collapsedSections['admin-tools'] || true,
        usage: 'low' as const,
        canCollapse: true
      }
    ];
  }, [navigationItems, pinnedItems, collapsedSections]);

  // Filter navigation items based on search
  const filteredSections = React.useMemo(() => {
    if (!searchQuery && selectedCategory === 'all') return organizedSections;

    return organizedSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const matchesSearch = !searchQuery || 
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      })
    })).filter(section => section.items.length > 0);
  }, [organizedSections, searchQuery, selectedCategory]);

  // Event handlers
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const togglePinItem = useCallback((itemId: string) => {
    setPinnedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleQuickAction = useCallback((actionId: string) => {
    const action = quickActionTemplates.find(t => t.id === actionId);
    if (action) {
      action.action();
      if (isMobile && onSidebarClose) {
        onSidebarClose();
      }
    }
  }, [quickActionTemplates, isMobile, onSidebarClose]);

  const handleSessionSwitch = useCallback((sessionId: string) => {
    setRecentSessions(prev => 
      prev.map(session => ({
        ...session,
        active: session.id === sessionId
      }))
    );
  }, []);

  // Keyboard shortcuts setup
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const template = quickActionTemplates.find(t => 
          t.shortcut.toLowerCase().includes(event.key.toLowerCase())
        );
        if (template) {
          event.preventDefault();
          template.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [quickActionTemplates]);

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={sidebarOpen}
      onClose={onSidebarClose}
      sx={{
        width: sidebarOpen ? sidebarWidth : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden'
        }
      }}
    >
      {/* Enhanced Sidebar Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: compactMode ? '0.9rem' : '1rem' }}>
            AgentHive Control
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Sidebar Options">
              <IconButton 
                size="small" 
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ 
                  bgcolor: alpha(theme.palette.action.selected, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.action.selected, 0.2) }
                }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Sidebar Options Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => setCompactMode(!compactMode)}>
            <ListItemIcon>
              {compactMode ? <UnfoldMore /> : <UnfoldLess />}
            </ListItemIcon>
            <ListItemText primary={compactMode ? "Expand Sidebar" : "Compact Mode"} />
          </MenuItem>
          <MenuItem onClick={() => setHideAgentContext(!hideAgentContext)}>
            <ListItemIcon>
              {hideAgentContext ? <Visibility /> : <VisibilityOff />}
            </ListItemIcon>
            <ListItemText primary={hideAgentContext ? "Show Agent Context" : "Hide Agent Context"} />
          </MenuItem>
          <MenuItem onClick={() => setShowQuickActions(!showQuickActions)}>
            <ListItemIcon>
              <FlashOn />
            </ListItemIcon>
            <ListItemText primary={showQuickActions ? "Hide Quick Actions" : "Show Quick Actions"} />
          </MenuItem>
        </Menu>

        {/* Search and Filter */}
        <TextField
          size="small"
          placeholder="Search capabilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2, width: '100%' }}
        />

        {/* Memory Context with Advanced Info */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Tooltip title="Memory usage indicates conversation history depth. Monitor to avoid hitting context limits.">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Memory fontSize="small" color="primary" />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Memory Context
                </Typography>
              </Stack>
            </Tooltip>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                {memoryUsage}%
              </Typography>
              <Chip 
                label={conversationCount}
                size="small"
                sx={{ height: 16, fontSize: '0.6rem' }}
              />
            </Stack>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={memoryUsage} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: alpha(theme.palette.action.selected, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: memoryUsage > 80 ? 
                  `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})` :
                  `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.warning.main})`
              }
            }} 
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {memoryUsage > 80 ? 'High usage - consider starting new session' : 
             memoryUsage > 60 ? 'Good conversation history depth' : 
             'Building conversation context'}
          </Typography>
        </Box>

        {/* Quick Settings */}
        {!compactMode && (
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={showQuickActions}
                  onChange={(e) => setShowQuickActions(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Quick Actions
                </Typography>
              }
            />
          </Stack>
        )}
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {/* Quick Actions Section */}
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box sx={{ px: 2, mb: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Quick Actions
                  </Typography>
                  <Tooltip title="Keyboard shortcuts available">
                    <Keyboard fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
                <Stack spacing={1}>
                  {quickActionTemplates.slice(0, compactMode ? 3 : 6).map((action) => (
                    <motion.div
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Paper
                        onClick={() => handleQuickAction(action.id)}
                        sx={{
                          p: compactMode ? 1 : 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.action.selected, 0.05),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={compactMode ? 1 : 1.5}>
                          <Box sx={{ color: 'primary.main', fontSize: compactMode ? 18 : 20 }}>
                            {action.icon}
                          </Box>
                          {!compactMode && (
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                                {action.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {action.shortcut}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </motion.div>
                  ))}
                </Stack>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Sections */}
        {filteredSections.map((section) => (
          <Box key={section.id} sx={{ mb: 1 }}>
            {section.items.length > 0 && (
              <>
                {/* Section Header */}
                <Box
                  onClick={() => section.canCollapse && toggleSection(section.id)}
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: section.canCollapse ? 'pointer' : 'default',
                    '&:hover': section.canCollapse ? {
                      bgcolor: alpha(theme.palette.action.hover, 0.1)
                    } : {}
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color: 'text.secondary', fontSize: 18 }}>
                      {section.icon}
                    </Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 700, 
                        color: 'text.secondary',
                        flex: 1,
                        fontSize: compactMode ? '0.75rem' : '0.875rem'
                      }}
                    >
                      {section.title}
                    </Typography>
                    <Chip
                      label={section.usage}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: alpha(
                          section.usage === 'high' ? theme.palette.success.main :
                          section.usage === 'medium' ? theme.palette.warning.main :
                          theme.palette.error.main, 0.1
                        ),
                        color: section.usage === 'high' ? 'success.main' :
                               section.usage === 'medium' ? 'warning.main' : 'error.main'
                      }}
                    />
                    {section.canCollapse && (
                      <Box sx={{ color: 'text.secondary' }}>
                        {section.isCollapsed ? <ExpandMore /> : <ExpandLess />}
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Section Items */}
                <AnimatePresence>
                  {!section.isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <List dense sx={{ py: 0 }}>
                        {section.items.map((item) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.15 }}
                          >
                            <ListItem disablePadding sx={{ mb: 0.5 }}>
                              <ListItemButton
                                selected={activeView === item.id}
                                onClick={() => {
                                  onViewChange(item.id);
                                  if (isMobile && onSidebarClose) {
                                    onSidebarClose();
                                  }
                                }}
                                sx={{
                                  mx: 1,
                                  borderRadius: 2,
                                  minHeight: compactMode ? 40 : 48,
                                  '&.Mui-selected': {
                                    bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                                    '&:hover': {
                                      bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`
                                    }
                                  },
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.action.hover, 0.1)
                                  }
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 40, color: activeView === item.id ? 'primary.main' : 'inherit' }}>
                                  {item.badge ? (
                                    <Badge badgeContent={item.badge} color="primary">
                                      {item.icon}
                                    </Badge>
                                  ) : item.icon}
                                </ListItemIcon>
                                
                                {!compactMode && (
                                  <>
                                    <ListItemText
                                      primary={item.label}
                                      secondary={item.description}
                                      primaryTypographyProps={{
                                        variant: 'body2',
                                        fontWeight: activeView === item.id ? 700 : 600,
                                        color: activeView === item.id ? 'primary.main' : 'inherit'
                                      }}
                                      secondaryTypographyProps={{
                                        variant: 'caption',
                                        sx: { 
                                          display: '-webkit-box',
                                          WebkitLineClamp: 1,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden'
                                        }
                                      }}
                                    />
                                    
                                    <Tooltip title={pinnedItems.includes(item.id) ? "Unpin from top" : "Pin to top for quick access"}>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePinItem(item.id);
                                        }}
                                        sx={{ 
                                          color: pinnedItems.includes(item.id) ? 'primary.main' : 'text.secondary',
                                          '&:hover': { color: 'primary.main' }
                                        }}
                                      >
                                        {pinnedItems.includes(item.id) ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </ListItemButton>
                            </ListItem>
                          </motion.div>
                        ))}
                      </List>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </Box>
        ))}

        {/* Recent Sessions with Better Management */}
        <Box sx={{ px: 2, mt: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Sessions
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Session management helps organize different projects and conversations">
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Bookmark fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton 
                size="small"
                onClick={() => toggleSection('sessions')}
                sx={{ color: 'text.secondary' }}
              >
                {collapsedSections['sessions'] ? <ExpandMore /> : <ExpandLess />}
              </IconButton>
            </Stack>
          </Stack>
          
          <AnimatePresence>
            {!collapsedSections['sessions'] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Stack spacing={1}>
                  {recentSessions.map((session) => (
                    <Paper
                      key={session.id}
                      onClick={() => handleSessionSwitch(session.id)}
                      sx={{
                        p: compactMode ? 1 : 1.5,
                        borderRadius: 2,
                        bgcolor: session.active 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.action.selected, 0.05),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.action.hover, 0.1),
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ 
                          width: compactMode ? 20 : 24, 
                          height: compactMode ? 20 : 24, 
                          bgcolor: session.active ? 'primary.main' : 'action.selected'
                        }}>
                          <History sx={{ fontSize: compactMode ? 12 : 14 }} />
                        </Avatar>
                        {!compactMode && (
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 600,
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {session.title}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
                              <Typography variant="caption" color="text.secondary">
                                {session.agentType}
                              </Typography>
                              <Chip 
                                label={`${session.messageCount} msgs`}
                                size="small"
                                sx={{ height: 16, fontSize: '0.6rem' }}
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {session.time}
                            </Typography>
                          </Box>
                        )}
                        {session.active && (
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'success.main' 
                          }} />
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Drawer>
  );
};

export default OptimizedSidebar;
