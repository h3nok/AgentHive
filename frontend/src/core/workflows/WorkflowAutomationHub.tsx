import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Stack,
  Grid,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import {
  AccessTime,
  PersonAdd,
  Assignment,
  Payment,
  CalendarToday,
  Notifications,
  Speed,
  AutoAwesome,
  PlayArrow,
  Pause,
  Settings,
  Add,
  TrendingUp,
  CheckCircle,
  Schedule,
  Group,
  Analytics,
  SmartToy,
  WorkspacePremium
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'hr' | 'finance' | 'operations' | 'compliance' | 'marketing';
  estimatedTime: string;
  complexity: 'simple' | 'moderate' | 'complex';
  agentsRequired: string[];
  successRate: number;
  timesUsed: number;
  isActive: boolean;
}

interface ActiveWorkflow {
  id: string;
  templateId: string;
  name: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  estimatedCompletion: string;
  assignedAgents: string[];
  currentStep: string;
  requestor: string;
}

const WorkflowAutomationHub: React.FC = () => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeWorkflows, setActiveWorkflows] = useState<ActiveWorkflow[]>([
    {
      id: 'wf-001',
      templateId: 'time-off-request',
      name: 'Time Off Request - John Doe',
      status: 'waiting_approval',
      progress: 75,
      startTime: '2025-06-20T09:00:00Z',
      estimatedCompletion: '2025-06-20T11:30:00Z',
      assignedAgents: ['HR Agent', 'Calendar Agent', 'Policy Agent'],
      currentStep: 'Manager approval pending',
      requestor: 'John Doe'
    },
    {
      id: 'wf-002', 
      templateId: 'expense-approval',
      name: 'Expense Report - Sarah Wilson',
      status: 'running',
      progress: 45,
      startTime: '2025-06-20T10:15:00Z',
      estimatedCompletion: '2025-06-20T12:00:00Z',
      assignedAgents: ['Finance Agent', 'Compliance Agent'],
      currentStep: 'Receipt validation in progress',
      requestor: 'Sarah Wilson'
    }
  ]);

  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: 'time-off-request',
      name: 'Time Off Request',
      description: 'Automated vacation, sick leave, and PTO requests with approval workflows',
      icon: <AccessTime />,
      category: 'hr',
      estimatedTime: '2-4 hours',
      complexity: 'simple',
      agentsRequired: ['HR Agent', 'Calendar Agent', 'Policy Agent'],
      successRate: 98,
      timesUsed: 1247,
      isActive: true
    },
    {
      id: 'expense-approval',
      name: 'Expense Approval',
      description: 'Smart expense report processing with receipt analysis and policy compliance',
      icon: <Payment />,
      category: 'finance',
      estimatedTime: '1-2 hours',
      complexity: 'moderate',
      agentsRequired: ['Finance Agent', 'Compliance Agent', 'OCR Agent'],
      successRate: 94,
      timesUsed: 892,
      isActive: true
    },
    {
      id: 'employee-onboarding',
      name: 'Employee Onboarding',
      description: 'Complete new hire setup including accounts, equipment, and training',
      icon: <PersonAdd />,
      category: 'hr',
      estimatedTime: '4-6 hours',
      complexity: 'complex',
      agentsRequired: ['HR Agent', 'IT Agent', 'Security Agent', 'Training Agent'],
      successRate: 96,
      timesUsed: 156,
      isActive: true
    },
    {
      id: 'contract-review',
      name: 'Contract Review',
      description: 'AI-powered contract analysis with risk assessment and approval routing',
      icon: <Assignment />,
      category: 'compliance',
      estimatedTime: '2-3 hours',
      complexity: 'complex',
      agentsRequired: ['Legal Agent', 'Risk Agent', 'Document Agent'],
      successRate: 92,
      timesUsed: 234,
      isActive: true
    },
    {
      id: 'meeting-scheduling',
      name: 'Smart Meeting Scheduling',
      description: 'Intelligent meeting coordination with availability analysis',
      icon: <CalendarToday />,
      category: 'operations',
      estimatedTime: '15-30 minutes',
      complexity: 'simple',
      agentsRequired: ['Calendar Agent', 'Communication Agent'],
      successRate: 99,
      timesUsed: 3421,
      isActive: true
    }
  ];

  const categories = [
    { id: 'all', label: 'All Categories', icon: <AutoAwesome /> },
    { id: 'hr', label: 'Human Resources', icon: <Group /> },
    { id: 'finance', label: 'Finance', icon: <Payment /> },
    { id: 'operations', label: 'Operations', icon: <Settings /> },
    { id: 'compliance', label: 'Compliance', icon: <Assignment /> },
    { id: 'marketing', label: 'Marketing', icon: <TrendingUp /> }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return theme.palette.info.main;
      case 'waiting_approval': return theme.palette.warning.main;
      case 'completed': return theme.palette.success.main;
      case 'failed': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return theme.palette.success.main;
      case 'moderate': return theme.palette.warning.main;
      case 'complex': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? workflowTemplates 
    : workflowTemplates.filter(t => t.category === selectedCategory);

  const handleStartWorkflow = useCallback((templateId: string) => {
    console.log('Starting workflow:', templateId);
    // Implementation would trigger workflow creation
  }, []);

  const handlePauseWorkflow = useCallback((workflowId: string) => {
    setActiveWorkflows(prev => 
      prev.map(wf => 
        wf.id === workflowId 
          ? { ...wf, status: wf.status === 'running' ? 'queued' : 'running' }
          : wf
      )
    );
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="body1" color="text.secondary">
              Autonomous enterprise workflows powered by specialized AI agents
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            }}
          >
            Create Workflow
          </Button>
        </Stack>

        {/* Quick Stats */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, flex: 1 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              {activeWorkflows.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Workflows
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, flex: 1 }}>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
              96%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Success Rate
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, flex: 1 }}>
            <Typography variant="h6" color="info.main" sx={{ fontWeight: 600 }}>
              2.4h
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg. Completion
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, flex: 1 }}>
            <Typography variant="h6" color="warning.main" sx={{ fontWeight: 600 }}>
              $2.3M
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Time Saved (Est.)
            </Typography>
          </Paper>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Active Workflows */}
          <Box sx={{ flex: { xs: 1, lg: '0 0 40%' } }}>
            <Paper sx={{ p: 3, height: 'fit-content', borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Active Workflows
                </Typography>
                <Badge badgeContent={activeWorkflows.length} color="primary">
                  <Schedule />
                </Badge>
              </Stack>

              <Stack spacing={2}>
                {activeWorkflows.map((workflow) => (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      sx={{ 
                        border: `1px solid ${alpha(getStatusColor(workflow.status), 0.3)}`,
                        backgroundColor: alpha(getStatusColor(workflow.status), 0.02)
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {workflow.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {workflow.currentStep}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handlePauseWorkflow(workflow.id)}
                            sx={{ color: getStatusColor(workflow.status) }}
                          >
                            {workflow.status === 'running' ? <Pause /> : <PlayArrow />}
                          </IconButton>
                        </Stack>

                        <Box sx={{ mb: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {workflow.progress}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={workflow.progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: alpha(getStatusColor(workflow.status), 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: getStatusColor(workflow.status)
                              }
                            }}
                          />
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {workflow.assignedAgents.map((agent, idx) => (
                            <Chip
                              key={idx}
                              label={agent}
                              size="small"
                              avatar={<Avatar sx={{ width: 20, height: 20 }}><SmartToy sx={{ fontSize: 12 }} /></Avatar>}
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Stack>
            </Paper>
          </Box>

          {/* Workflow Templates */}
          <Box sx={{ flex: { xs: 1, lg: '0 0 60%' } }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Workflow Templates
              </Typography>

              {/* Category Filter */}
              <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.label}
                    icon={category.icon}
                    clickable
                    variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                    onClick={() => setSelectedCategory(category.id)}
                    sx={{
                      backgroundColor: selectedCategory === category.id 
                        ? alpha(theme.palette.primary.main, 0.1) 
                        : 'transparent',
                      borderColor: selectedCategory === category.id 
                        ? theme.palette.primary.main 
                        : alpha(theme.palette.divider, 0.5)
                    }}
                  />
                ))}
              </Stack>

              {/* Template Grid */}
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 2 
                }}
              >
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
                        }
                      }}
                      onClick={() => handleStartWorkflow(template.id)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" alignItems="flex-start" spacing={2} mb={2}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            {template.icon}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {template.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {template.description}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                          <Chip
                            label={template.complexity}
                            size="small"
                            sx={{
                              backgroundColor: alpha(getComplexityColor(template.complexity), 0.1),
                              color: getComplexityColor(template.complexity),
                              textTransform: 'capitalize'
                            }}
                          />
                          <Chip
                            label={template.estimatedTime}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={2}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                Success Rate
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {template.successRate}%
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                Used
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {template.timesUsed}
                              </Typography>
                            </Box>
                          </Stack>
                          <WorkspacePremium 
                            sx={{ 
                              color: template.isActive ? theme.palette.success.main : theme.palette.text.disabled 
                            }} 
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </Paper>
          </Box>
        </Stack>
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Create Workflow Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Workflow</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Workflow creation interface would be implemented here...
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WorkflowAutomationHub;
