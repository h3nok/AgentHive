import React, { useState, useCallback } from 'react';
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
  FormControlLabel
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
  UnfoldMore
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
}

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: NavigationItem[];
  isCollapsed: boolean;
  isPinned: boolean;
  usage: 'high' | 'medium' | 'low';
}

interface EnhancedSidebarProps {
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeView: string;
  navigationItems: NavigationItem[];
  onViewChange: (viewId: string) => void;
  theme: any;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  sidebarOpen,
  sidebarWidth,
  activeView,
  navigationItems,
  onViewChange,
  theme
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'connected-tools': true,
    'performance': true,
    'sessions': false
  });
  
  const [pinnedItems, setPinnedItems] = useState<string[]>(['command-center', 'chat-interface', 'workflows']);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  // Organize navigation items into logical sections
  const organizedSections: SidebarSection[] = [
    {
      id: 'pinned',
      title: 'Pinned',
      icon: <PushPin />,
      items: navigationItems.filter(item => pinnedItems.includes(item.id)),
      isCollapsed: false,
      isPinned: true,
      usage: 'high'
    },
    {
      id: 'core-functions',
      title: 'Core Functions',
      icon: <Dashboard />,
      items: navigationItems.filter(item => 
        ['command-center', 'chat-interface', 'workflows', 'orchestration'].includes(item.id) &&
        !pinnedItems.includes(item.id)
      ),
      isCollapsed: false,
      isPinned: false,
      usage: 'high'
    },
    {
      id: 'analysis-tools',
      title: 'Analysis & Insights',
      icon: <Assessment />,
      items: navigationItems.filter(item => 
        ['analytics', 'time-off-demo'].includes(item.id) &&
        !pinnedItems.includes(item.id)
      ),
      isCollapsed: collapsedSections['analysis-tools'] || false,
      isPinned: false,
      usage: 'medium'
    },
    {
      id: 'admin-tools',
      title: 'Administration',
      icon: <Settings />,
      items: navigationItems.filter(item => 
        ['settings'].includes(item.id) &&
        !pinnedItems.includes(item.id)
      ),
      isCollapsed: collapsedSections['admin-tools'] || true,
      isPinned: false,
      usage: 'low'
    }
  ];

  const quickActions = [
    { id: 'new-workflow', label: 'New Workflow', icon: <AutoAwesome />, shortcut: 'Ctrl+N' },
    { id: 'quick-chat', label: 'Quick Ask', icon: <Chat />, shortcut: 'Ctrl+K' },
    { id: 'system-status', label: 'System Status', icon: <Speed />, shortcut: 'Ctrl+S' },
    { id: 'time-off', label: 'Time Off', icon: <Schedule />, shortcut: 'Ctrl+T' }
  ];

  const recentSessions = [
    { id: '1', title: 'Workflow Automation Setup', time: '2 hours ago', active: true },
    { id: '2', title: 'Employee Onboarding Process', time: '1 day ago', active: false },
    { id: '3', title: 'Budget Analysis Review', time: '2 days ago', active: false }
  ];

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
    switch (actionId) {
      case 'new-workflow':
        onViewChange('workflows');
        break;
      case 'quick-chat':
        onViewChange('chat-interface');
        break;
      case 'system-status':
        onViewChange('command-center');
        break;
      case 'time-off':
        onViewChange('time-off-demo');
        break;
    }
  }, [onViewChange]);

  return (
    <Drawer
      variant="persistent"
      open={sidebarOpen}
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
      {/* Sidebar Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            AgentHive Control
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title={compactMode ? "Expand Sidebar" : "Compact Sidebar"}>
              <IconButton 
                size="small" 
                onClick={() => setCompactMode(!compactMode)}
                sx={{ 
                  bgcolor: alpha(theme.palette.action.selected, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.action.selected, 0.2) }
                }}
              >
                {compactMode ? <UnfoldMore /> : <UnfoldLess />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Memory Context Indicator */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Memory Context
            </Typography>
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
              45%
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={45} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: alpha(theme.palette.action.selected, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.warning.main})`
              }
            }} 
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Good conversation history. Monitor to avoid limits.
          </Typography>
        </Box>

        {/* Compact Mode Toggle */}
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
          sx={{ mb: 1 }}
        />
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
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  {quickActions.map((action) => (
                    <motion.div
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Box
                        onClick={() => handleQuickAction(action.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.action.selected, 0.05),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box sx={{ color: 'primary.main', fontSize: 20 }}>
                            {action.icon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                              {action.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {action.shortcut}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </motion.div>
                  ))}
                </Stack>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Sections */}
        {organizedSections.map((section) => (
          <Box key={section.id} sx={{ mb: 1 }}>
            {section.items.length > 0 && (
              <>
                {/* Section Header */}
                <Box
                  onClick={() => !section.isPinned && toggleSection(section.id)}
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: section.isPinned ? 'default' : 'pointer',
                    '&:hover': !section.isPinned ? {
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
                    {!section.isPinned && (
                      <Box sx={{ color: 'text.secondary' }}>
                        {section.isCollapsed ? <ExpandMore /> : <ExpandLess />}
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Section Items */}
                <AnimatePresence>
                  {(!section.isCollapsed || section.isPinned) && (
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
                                onClick={() => onViewChange(item.id)}
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
                                  {item.icon}
                                </ListItemIcon>
                                
                                {!compactMode && (
                                  <>
                                    <ListItemText
                                      primary={item.label}
                                      secondary={!compactMode ? item.description : undefined}
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
                                    
                                    <Stack direction="column" alignItems="center" spacing={0.5}>
                                      {item.badge && (
                                        <Badge badgeContent={item.badge} color="primary" />
                                      )}
                                      
                                      <Tooltip title={pinnedItems.includes(item.id) ? "Unpin" : "Pin to top"}>
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
                                    </Stack>
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

        {/* Recent Sessions */}
        <Box sx={{ px: 2, mt: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Recent Sessions
            </Typography>
            <IconButton 
              size="small"
              onClick={() => toggleSection('sessions')}
              sx={{ color: 'text.secondary' }}
            >
              {collapsedSections['sessions'] ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
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
                    <Box
                      key={session.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: session.active 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.action.selected, 0.05),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.action.hover, 0.1)
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                          <History sx={{ fontSize: 14 }} />
                        </Avatar>
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
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {session.time}
                          </Typography>
                        </Box>
                        {session.active && (
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'success.main' 
                          }} />
                        )}
                      </Stack>
                    </Box>
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

export default EnhancedSidebar;
