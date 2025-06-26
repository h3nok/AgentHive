import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Stack,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close,
  AccountTree,
  Code,
  BugReport,
  Speed,
  Memory,
  Psychology,
  Build,
  Api,
  Timeline,
  PlayArrow,
  Pause,
  Stop,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import our existing components
import WorkflowVisualizationPanel from './WorkflowVisualizationPanel';

interface CommandCenterProps {
  open: boolean;
  onClose: () => void;
  onWorkflowAction?: (action: string, workflowId?: string) => void;
  onSidebarToggle?: (collapsed: boolean) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`command-center-tabpanel-${index}`}
      aria-labelledby={`command-center-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Mock data for workflows
const mockWorkflows = [
  {
    id: 'workflow-1',
    name: 'Customer Support Flow',
    description: 'Automated customer support workflow with AI agents',
    status: 'running' as const,
    progress: 65,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    createdBy: 'System',
    steps: [
      {
        id: 'step-1',
        name: 'Initial Assessment',
        type: 'agent' as const,
        status: 'completed' as const,
        agent: 'support',
        duration: 2000,
        position: { x: 100, y: 100 },
        description: 'Analyze customer inquiry'
      },
      {
        id: 'step-2',
        name: 'Route to Specialist',
        type: 'system' as const,
        status: 'running' as const,
        position: { x: 300, y: 100 },
        description: 'Route to appropriate specialist'
      }
    ],
    connections: [{ from: 'step-1', to: 'step-2' }]
  }
];



// System Monitor Component
const SystemMonitor: React.FC = () => {
  const theme = useTheme();

  const systemStats = [
    { label: 'CPU Usage', value: '45%', icon: <Speed />, color: theme.palette.success.main },
    { label: 'Memory', value: '2.4GB', icon: <Memory />, color: theme.palette.warning.main },
    { label: 'Active Agents', value: '3', icon: <Psychology />, color: theme.palette.primary.main },
    { label: 'API Calls/min', value: '127', icon: <Api />, color: theme.palette.info.main }
  ];

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        System Monitor
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
        gap: 2 
      }}>
        {systemStats.map((stat, index) => (
          <Card key={index} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: alpha(stat.color, 0.1),
                  color: stat.color
                }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

// Workflow Builder Component
const WorkflowBuilder: React.FC<{ onWorkflowAction?: (action: string, workflowId?: string) => void }> = ({ 
  onWorkflowAction 
}) => {
  const theme = useTheme();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('workflow-1');

  const handleWorkflowAction = (action: string) => {
    onWorkflowAction?.(action, selectedWorkflow);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Workflow Builder
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button 
            startIcon={<PlayArrow />} 
            size="small" 
            variant="contained"
            onClick={() => handleWorkflowAction('play')}
          >
            Run
          </Button>
          <Button 
            startIcon={<Pause />} 
            size="small" 
            variant="outlined"
            onClick={() => handleWorkflowAction('pause')}
          >
            Pause
          </Button>
          <Button 
            startIcon={<Stop />} 
            size="small" 
            variant="outlined" 
            color="error"
            onClick={() => handleWorkflowAction('stop')}
          >
            Stop
          </Button>
        </Stack>
      </Stack>
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <WorkflowVisualizationPanel 
          workflow={mockWorkflows[0]}
          onStepClick={(stepId) => console.log('Step clicked:', stepId)}
          onWorkflowControl={handleWorkflowAction}
          onEditWorkflow={() => console.log('Edit workflow')}
          onShareWorkflow={() => console.log('Share workflow')}
          height={400}
        />
      </Box>
    </Box>
  );
};

const CommandCenter: React.FC<CommandCenterProps> = ({ 
  open, 
  onClose, 
  onWorkflowAction, 
  onSidebarToggle 
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Handle sidebar visibility when Command Center opens/closes
  React.useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(open); // Collapse sidebar when opening, restore when closing
    }
  }, [open, onSidebarToggle]);

  const handleClose = React.useCallback(() => {
    onClose();
    // Sidebar will be restored via the useEffect above
  }, [onClose]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const tabs = [
    { label: 'Workflows', icon: <AccountTree />, component: WorkflowBuilder },
    { label: 'System', icon: <Speed />, component: SystemMonitor },
    { label: 'Tools', icon: <Build />, component: () => <Typography>Tool Management - Coming Soon</Typography> }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          backgroundColor: theme.palette.background.default,
          zIndex: theme.zIndex.modal + 100, // Ensure it's above sidebar
        }
      }}
      sx={{
        zIndex: theme.zIndex.modal + 100,
        '& .MuiBackdrop-root': {
          backgroundColor: alpha(theme.palette.common.black, 0.8)
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}>
              <Build />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Autoprise Command Center
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workflow management, debugging, and system monitoring
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleClose} size="large">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Sidebar Tabs */}
          <Box sx={{ 
            width: 200, 
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.5)
          }}>
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={handleTabChange}
              sx={{ 
                height: '100%',
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  minHeight: 64,
                  px: 3
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                  sx={{
                    justifyContent: 'flex-start',
                    '& .MuiTab-iconWrapper': {
                      mr: 1
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>
          
          {/* Tab Content */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              {tabs.map((tab, index) => (
                <TabPanel key={index} value={activeTab} index={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    style={{ height: '100%' }}
                  >
                    <tab.component 
                      onWorkflowAction={onWorkflowAction}
                    />
                  </motion.div>
                </TabPanel>
              ))}
            </AnimatePresence>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CommandCenter;
