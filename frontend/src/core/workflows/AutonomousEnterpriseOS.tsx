import React, { useState, useCallback } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Stack,
  Badge,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Paper,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu,
  Dashboard,
  SmartToy,
  AutoAwesome,
  Hub,
  Assessment,
  Settings,
  Notifications,
  Search,
  AccountCircle,
  Brightness4,
  Brightness7,
  ExitToApp,
  ChevronLeft,
  ChevronRight,
  Psychology,
  Speed,
  TrendingUp,
  Security,
  Group,
  AccountBalance,
  Engineering,
  Schedule,
  Chat,
  VisibilityOff
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import our new components
import WorkflowAutomationHub from './WorkflowAutomationHub';
import EnhancedWorkflowAutomationHub from './EnhancedWorkflowAutomationHub';
import AgentOrchestrationDashboard from './AgentOrchestrationDashboard';
import EnterpriseCommandCenter from './EnterpriseCommandCenter';
import ChatInterface from './ChatInterface';
import AgentContextPanel from './AgentContextPanel';
import TimeOffAutomationDemo from './TimeOffAutomationDemo';
import EnhancedSidebar from './EnhancedSidebar';
import OptimizedSidebar from './OptimizedSidebar';

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

interface Agent {
  id: string;
  name: string;
  status: 'ready' | 'thinking' | 'processing' | 'offline' | 'error';
  memoryContext: number;
  capabilities: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
    status: 'active' | 'idle' | 'error';
  }>;
  tools: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
    status: 'connected' | 'disconnected' | 'error';
    lastUsed?: string;
  }>;
  metrics?: {
    totalQueries: number;
    successRate: number;
    avgResponseTime: number;
    tokensUsed: number;
  };
}

const AutonomousEnterpriseOS: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeView, setActiveView] = useState('command-center');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [rightPanelOpen, setRightPanelOpen] = useState(!isMobile);
  const [agentContextVisible, setAgentContextVisible] = useState(!isMobile);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>('workflow-orchestrator');

  const sidebarWidth = 280;
  const rightPanelWidth = 350;

  const navigationItems: NavigationItem[] = [
    {
      id: 'command-center',
      label: 'Command Center',
      icon: <Dashboard />,
      component: EnterpriseCommandCenter,
      description: 'Executive dashboard and system overview',
      category: 'core'
    },
    {
      id: 'chat-interface',
      label: 'AI Assistant',
      icon: <Chat />,
      component: ChatInterface,
      description: 'Natural language workflow automation',
      category: 'core'
    },
    {
      id: 'time-off-demo',
      label: 'Time Off Demo',
      icon: <Schedule />,
      component: TimeOffAutomationDemo,
      description: 'Interactive time off request automation demo',
      category: 'tools'
    },
    {
      id: 'workflows',
      label: 'Workflow Hub',
      icon: <AutoAwesome />,
      component: EnhancedWorkflowAutomationHub,
      description: 'Automated business process management',
      badge: 23,
      category: 'core'
    },
    {
      id: 'orchestration',
      label: 'Agent Network',
      icon: <Hub />,
      component: AgentOrchestrationDashboard,
      description: 'Real-time agent collaboration visualization',
      category: 'core'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <Assessment />,
      component: () => <Box sx={{ p: 3 }}><Typography>Analytics Dashboard Coming Soon</Typography></Box>,
      description: 'Performance metrics and insights',
      category: 'analysis'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings />,
      component: () => <Box sx={{ p: 3 }}><Typography>Settings Panel Coming Soon</Typography></Box>,
      description: 'System configuration and preferences',
      category: 'admin'
    }
  ];

  // Sample agent data
  const currentAgent: Agent = {
    id: 'workflow-orchestrator',
    name: 'Workflow Orchestrator',
    status: 'ready',
    memoryContext: 67,
    capabilities: [
      { id: 'nlp', name: 'Natural Language', icon: <Psychology />, status: 'active' },
      { id: 'workflow', name: 'Workflow Design', icon: <AutoAwesome />, status: 'active' },
      { id: 'coordination', name: 'Agent Coordination', icon: <Hub />, status: 'active' },
      { id: 'optimization', name: 'Process Optimization', icon: <Speed />, status: 'idle' }
    ],
    tools: [
      { id: 'calendar', name: 'Calendar API', icon: <Schedule />, status: 'connected', lastUsed: '2 minutes ago' },
      { id: 'hr-system', name: 'HR Database', icon: <Group />, status: 'connected', lastUsed: '5 minutes ago' },
      { id: 'finance', name: 'Finance API', icon: <AccountBalance />, status: 'connected', lastUsed: '1 hour ago' },
      { id: 'security', name: 'Security Layer', icon: <Security />, status: 'connected', lastUsed: 'Always active' }
    ],
    metrics: {
      totalQueries: 1247,
      successRate: 96,
      avgResponseTime: 1.2,
      tokensUsed: 89456
    }
  };

  const handleViewChange = useCallback((viewId: string) => {
    setActiveView(viewId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleSendMessage = useCallback((message: string, agent?: string, workflow?: string) => {
    console.log('Message sent:', { message, agent, workflow });
    // Implementation would handle message routing to appropriate agents
  }, []);

  const handleWorkflowTrigger = useCallback((workflowId: string, params?: any) => {
    console.log('Workflow triggered:', { workflowId, params });
    // Implementation would start workflow execution
  }, []);

  const ActiveComponent = navigationItems.find(item => item.id === activeView)?.component || EnterpriseCommandCenter;

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`
    }}>
      {/* Enhanced App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            color="inherit"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            edge="start"
            sx={{ 
              mr: 3,
              bgcolor: alpha(theme.palette.common.white, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.2),
                transform: 'scale(1.05)'
              }
            }}
          >
            <Menu />
          </IconButton>
          
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.common.white, 0.2),
                color: theme.palette.common.white,
                width: 40,
                height: 40
              }}
            >
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                AgentHive Enterprise OS
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500 }}>
                Autonomous Business Intelligence Platform
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title="System Health: 96%" arrow>
              <Chip 
                label="96% Health"
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.2),
                  color: theme.palette.common.white,
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.3)
                  }
                }}
              />
            </Tooltip>
            
            <IconButton 
              color="inherit"
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  transform: 'scale(1.05)'
                }
              }}
            >
              <Search />
            </IconButton>
            
            <Badge badgeContent={3} color="error">
              <IconButton 
                color="inherit"
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Notifications />
              </IconButton>
            </Badge>
            
            <IconButton 
              onClick={() => setDarkMode(!darkMode)} 
              color="inherit"
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  transform: 'scale(1.05)'
                }
              }}
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            
            <Tooltip title={agentContextVisible ? "Hide Agent Context Panel" : "Show Agent Context Panel"} arrow>
              <IconButton 
                onClick={() => {
                  setAgentContextVisible(!agentContextVisible);
                  setRightPanelOpen(!agentContextVisible && !isMobile);
                }} 
                color="inherit"
                sx={{
                  bgcolor: agentContextVisible 
                    ? alpha(theme.palette.common.white, 0.2)
                    : alpha(theme.palette.common.white, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Psychology />
              </IconButton>
            </Tooltip>
            
            <IconButton 
              color="inherit"
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  transform: 'scale(1.05)'
                }
              }}
            >
              <AccountCircle />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Optimized Sidebar with Advanced Management */}
      <OptimizedSidebar
        sidebarOpen={sidebarOpen}
        sidebarWidth={sidebarWidth}
        activeView={activeView}
        navigationItems={navigationItems}
        onViewChange={handleViewChange}
        theme={theme}
        isMobile={isMobile}
        onSidebarClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: sidebarOpen && !isMobile ? 0 : `-${sidebarWidth}px`,
          marginRight: (rightPanelOpen && agentContextVisible && !isMobile) ? 0 : `-${rightPanelWidth}px`,
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Toolbar />
          
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                {React.createElement(ActiveComponent, activeView === 'chat-interface' ? {
                  onSendMessage: handleSendMessage,
                  onWorkflowTrigger: handleWorkflowTrigger,
                  enterpriseMode: true,
                  activeWorkflows: 23, // This would come from real data
                  onNavigateToWorkflows: () => handleViewChange('workflows'),
                  onNavigateToAgents: () => handleViewChange('orchestration'),
                  currentAgent: {
                    id: currentAgent.id,
                    name: currentAgent.name,
                    status: currentAgent.status
                  }
                } : activeView === 'workflows' ? {
                  // Pass any specific props to WorkflowAutomationHub
                } : {})}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Box>

      {/* Right Panel - Agent Context */}
      {agentContextVisible && (
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor="right"
          open={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          sx={{
            width: rightPanelOpen ? rightPanelWidth : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: rightPanelWidth,
              boxSizing: 'border-box',
              background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
              backdropFilter: 'blur(10px)',
              borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }
          }}
        >
          <Toolbar />
          
          <Box sx={{ p: 2, overflow: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Agent Context
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Hide Agent Context Panel">
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setAgentContextVisible(false);
                      setRightPanelOpen(false);
                    }}
                  >
                    <VisibilityOff />
                  </IconButton>
                </Tooltip>
                <IconButton 
                  size="small" 
                  onClick={() => setRightPanelOpen(false)}
                >
                  <ChevronRight />
                </IconButton>
              </Stack>
            </Stack>
            
            {selectedAgent && (
              <AgentContextPanel 
                agent={currentAgent}
                onCapabilityClick={(capabilityId) => console.log('Capability clicked:', capabilityId)}
                onToolClick={(toolId) => console.log('Tool clicked:', toolId)}
                onConfigureAgent={(agentId) => console.log('Configure agent:', agentId)}
                onViewMetrics={(agentId) => console.log('View metrics:', agentId)}
                isExpanded={true}
              />
            )}
          </Box>
        </Drawer>
      )}

      {/* Toggle Right Panel Button */}
      {!rightPanelOpen && agentContextVisible && !isMobile && (
        <Box
          sx={{
            position: 'fixed',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: theme.zIndex.drawer + 2
          }}
        >
          <Tooltip title="Show Agent Context" placement="left">
            <IconButton
              onClick={() => setRightPanelOpen(true)}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark
                }
              }}
            >
              <ChevronLeft />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default AutonomousEnterpriseOS;
