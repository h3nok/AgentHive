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
  WorkspacePremium,
  Timeline,
  Insights,
  RocketLaunch
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

const EnhancedWorkflowAutomationHub: React.FC = () => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: 'time-off-request',
      name: 'Time Off Request',
      description: 'Automated vacation, sick leave, and PTO requests with intelligent approval workflows',
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
      description: 'Complete new hire setup including accounts, equipment, and training coordination',
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
      description: 'Intelligent meeting coordination with availability analysis and conflict resolution',
      icon: <CalendarToday />,
      category: 'operations',
      estimatedTime: '15-30 minutes',
      complexity: 'simple',
      agentsRequired: ['Calendar Agent', 'Communication Agent'],
      successRate: 99,
      timesUsed: 3421,
      isActive: true
    },
    {
      id: 'performance-review',
      name: 'Performance Review',
      description: 'Automated performance analytics and comprehensive review generation',
      icon: <Timeline />,
      category: 'hr',
      estimatedTime: '3-5 hours',
      complexity: 'moderate',
      agentsRequired: ['Analytics Agent', 'HR Agent', 'Performance Agent'],
      successRate: 95,
      timesUsed: 78,
      isActive: true
    }
  ];

  const [activeWorkflows] = useState<ActiveWorkflow[]>([
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
    },
    {
      id: 'wf-003',
      templateId: 'employee-onboarding',
      name: 'New Hire Onboarding - Mike Chen',
      status: 'running',
      progress: 20,
      startTime: '2025-06-20T08:00:00Z',
      estimatedCompletion: '2025-06-20T14:00:00Z',
      assignedAgents: ['HR Agent', 'IT Agent', 'Security Agent'],
      currentStep: 'Account creation in progress',
      requestor: 'Mike Chen'
    }
  ]);

  const categories = [
    { id: 'all', label: 'All Workflows', icon: <AutoAwesome />, count: workflowTemplates.length },
    { id: 'hr', label: 'Human Resources', icon: <Group />, count: workflowTemplates.filter(t => t.category === 'hr').length },
    { id: 'finance', label: 'Finance', icon: <Payment />, count: workflowTemplates.filter(t => t.category === 'finance').length },
    { id: 'operations', label: 'Operations', icon: <Settings />, count: workflowTemplates.filter(t => t.category === 'operations').length },
    { id: 'compliance', label: 'Compliance', icon: <Assignment />, count: workflowTemplates.filter(t => t.category === 'compliance').length },
    { id: 'marketing', label: 'Marketing', icon: <TrendingUp />, count: workflowTemplates.filter(t => t.category === 'marketing').length }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? workflowTemplates 
    : workflowTemplates.filter(template => template.category === selectedCategory);

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

  const handleTriggerWorkflow = useCallback((templateId: string) => {
    console.log('Triggering workflow:', templateId);
    // Implementation would trigger actual workflow
  }, []);

  return (
    <Box sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
      overflow: 'auto'
    }}>
      {/* Enhanced Header */}
      <Box sx={{ 
        p: { xs: 2, md: 4 }, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(20px)'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3} mb={4}>
          <Box>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Intelligent workflow orchestration powered by specialized AI agents
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Tooltip title="Workflow Analytics">
              <IconButton 
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: 'info.main',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.info.main, 0.2),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Insights />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Create Custom Workflow">
              <Fab
                color="primary"
                size="medium"
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
                  }
                }}
              >
                <Add />
              </Fab>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Enhanced Stats Cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={4}>
          {[
            { value: activeWorkflows.length, label: 'Active Workflows', color: 'primary' as const, icon: <RocketLaunch /> },
            { value: '96%', label: 'Success Rate', color: 'success' as const, icon: <CheckCircle /> },
            { value: '2.4h', label: 'Avg. Completion', color: 'info' as const, icon: <Schedule /> },
            { value: '$2.3M', label: 'Annual Savings', color: 'warning' as const, icon: <TrendingUp /> }
          ].map((stat, index) => {
            const colorPalette = theme.palette[stat.color];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ flex: 1 }}
              >
                <Paper 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    borderRadius: 4, 
                    background: `linear-gradient(135deg, ${alpha(colorPalette.main, 0.05)} 0%, ${alpha(colorPalette.main, 0.1)} 100%)`,
                    border: `1px solid ${alpha(colorPalette.main, 0.1)}`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(colorPalette.main, 0.15)}`
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Stack alignItems="center" spacing={1.5}>
                    <Box sx={{ color: `${stat.color}.main`, fontSize: 32 }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h4" color={`${stat.color}.main`} sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {stat.label}
                    </Typography>
                  </Stack>
                </Paper>
              </motion.div>
            );
          })}
        </Stack>

        {/* Enhanced Category Filter */}
        <Box>
          <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 2 }}>
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Chip
                  icon={category.icon}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <span>{category.label}</span>
                      <Badge 
                        badgeContent={category.count} 
                        color="secondary"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.6rem',
                            height: 16,
                            minWidth: 16
                          }
                        }}
                      />
                    </Stack>
                  }
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "filled" : "outlined"}
                  sx={{
                    px: 2,
                    py: 0.5,
                    height: 44,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    ...(selectedCategory === category.id && {
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      color: 'white',
                      border: 'none',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                    }),
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                />
              </motion.div>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Enhanced Main Content */}
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={5}>
          {/* Workflow Templates Section */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Available Templates
              </Typography>
              <Chip 
                label={`${filteredTemplates.length} templates`}
                size="medium"
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 600,
                  px: 2
                }}
              />
            </Stack>
            
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  lg: 'repeat(3, 1fr)' 
                },
                gap: 3 
              }}
            >
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      backdropFilter: 'blur(20px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.15)}`,
                        transform: 'translateY(-8px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={3}>
                        {/* Template Header */}
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                          <Box sx={{ 
                            p: 2,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            fontSize: 28
                          }}>
                            {template.icon}
                          </Box>
                          <Chip
                            label={template.complexity}
                            size="small"
                            sx={{
                              bgcolor: alpha(getComplexityColor(template.complexity), 0.1),
                              color: getComplexityColor(template.complexity),
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              borderRadius: 2
                            }}
                          />
                        </Stack>

                        {/* Template Content */}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                            {template.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              lineHeight: 1.6,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {template.description}
                          </Typography>
                        </Box>

                        {/* Template Stats */}
                        <Stack direction="row" spacing={3}>
                          <Stack alignItems="center" spacing={0.5}>
                            <Schedule sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {template.estimatedTime}
                            </Typography>
                          </Stack>
                          <Stack alignItems="center" spacing={0.5}>
                            <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {template.successRate}% success
                            </Typography>
                          </Stack>
                          <Stack alignItems="center" spacing={0.5}>
                            <Insights sx={{ fontSize: 18, color: 'info.main' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {template.timesUsed} uses
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* Template Actions */}
                        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                          <Button
                            variant="contained"
                            size="medium"
                            startIcon={<RocketLaunch />}
                            onClick={() => handleTriggerWorkflow(template.id)}
                            sx={{
                              flex: 1,
                              borderRadius: 3,
                              py: 1.5,
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              fontWeight: 600,
                              '&:hover': {
                                transform: 'scale(1.02)'
                              }
                            }}
                          >
                            Launch
                          </Button>
                          <Tooltip title="Configure Template">
                            <IconButton 
                              size="medium"
                              sx={{ 
                                bgcolor: alpha(theme.palette.action.selected, 0.1),
                                borderRadius: 2,
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.action.selected, 0.2),
                                  transform: 'scale(1.05)'
                                }
                              }}
                            >
                              <Settings />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* Active Workflows Section */}
          {activeWorkflows.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Active Workflows
                </Typography>
                <Badge badgeContent={activeWorkflows.length} color="primary">
                  <Schedule sx={{ fontSize: 28 }} />
                </Badge>
              </Stack>

              <Stack spacing={3}>
                {activeWorkflows.map((workflow, index) => (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Paper 
                      sx={{ 
                        p: 3,
                        borderRadius: 4,
                        border: `1px solid ${alpha(getStatusColor(workflow.status), 0.3)}`,
                        backgroundColor: alpha(getStatusColor(workflow.status), 0.02),
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 32px ${alpha(getStatusColor(workflow.status), 0.1)}`
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            {workflow.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {workflow.currentStep}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={workflow.progress} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: alpha(getStatusColor(workflow.status), 0.1),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getStatusColor(workflow.status),
                                borderRadius: 4
                              }
                            }} 
                          />
                        </Box>
                        <Stack alignItems="flex-end" spacing={1}>
                          <Chip
                            label={workflow.status.replace('_', ' ')}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(workflow.status), 0.1),
                              color: getStatusColor(workflow.status),
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {workflow.progress}% complete
                          </Typography>
                        </Stack>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {workflow.assignedAgents.map((agent, idx) => (
                          <Chip
                            key={idx}
                            label={agent}
                            size="small"
                            avatar={
                              <Avatar sx={{ width: 20, height: 20, bgcolor: 'primary.main' }}>
                                <SmartToy sx={{ fontSize: 12 }} />
                              </Avatar>
                            }
                            sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  </motion.div>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default EnhancedWorkflowAutomationHub;
