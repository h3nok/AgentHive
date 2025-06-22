import React, { useState, useEffect } from 'react';
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
  Divider,
  Badge,
  Alert,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Speed,
  SmartToy,
  AutoAwesome,
  Schedule,
  Assessment,
  Security,
  MonitorHeart,
  CloudQueue,
  Storage,
  Memory,
  ElectricBolt,
  Psychology,
  Engineering,
  AccountBalance,
  Group,
  Notifications,
  Settings,
  Refresh,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { enterpriseAPI, SystemHealth, CostAnalysis, DepartmentPerformance } from '../services/enterpriseAPI';

interface SystemMetrics {
  overallHealth: number;
  activeAgents: number;
  totalAgents: number;
  runningWorkflows: number;
  completedToday: number;
  averageResponseTime: number;
  successRate: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  costs: {
    daily: number;
    monthly: number;
    savings: number;
  };
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  agent?: string;
  workflow?: string;
  acknowledged: boolean;
}

interface DepartmentStats {
  id: string;
  name: string;
  icon: React.ReactNode;
  agentsActive: number;
  workflowsToday: number;
  efficiency: number;
  costSavings: number;
  status: 'optimal' | 'good' | 'attention' | 'critical';
}

const EnterpriseCommandCenter: React.FC = () => {
  const theme = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [systemStatus, setSystemStatus] = useState<'running' | 'maintenance' | 'emergency'>('running');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  // Real data state
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [healthData, costData, deptData] = await Promise.all([
          enterpriseAPI.getSystemHealth(),
          enterpriseAPI.getCostAnalysis(),
          enterpriseAPI.getDepartmentPerformance()
        ]);
        
        setSystemHealth(healthData);
        setCostAnalysis(costData);
        setDepartmentPerformance(deptData);
        setError(null);
      } catch (err) {
        console.error('Error loading enterprise data:', err);
        setError('Failed to load system data. Using fallback data.');
        
        // Set fallback data
        setSystemHealth({
          status: 'operational',
          uptime: '99.97%',
          cpu_usage: 34,
          memory_usage: 67,
          storage_usage: 23,
          network_throughput: 180,
          active_agents: 47,
          total_workflows: 1287,
          completed_today: 187,
          error_rate: 0.3,
          response_time: 120,
          last_updated: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time updates
    const cleanup = enterpriseAPI.startPolling('/system/health', (data) => {
      setSystemHealth(data);
    }, 30000); // Update every 30 seconds

    return cleanup;
  }, []);

  // Derive metrics from real data or use fallback
  const metrics: SystemMetrics = systemHealth ? {
    overallHealth: systemHealth.status === 'operational' ? 96 : 75,
    activeAgents: systemHealth.active_agents,
    totalAgents: systemHealth.active_agents + 5, // Estimate total
    runningWorkflows: Math.floor(systemHealth.total_workflows * 0.02), // 2% running
    completedToday: systemHealth.completed_today,
    averageResponseTime: systemHealth.response_time / 1000, // Convert to seconds
    successRate: 100 - systemHealth.error_rate,
    resourceUtilization: {
      cpu: systemHealth.cpu_usage,
      memory: systemHealth.memory_usage,
      storage: systemHealth.storage_usage,
      network: systemHealth.network_throughput / 10 // Normalize to percentage
    },
    costs: costAnalysis ? {
      daily: costAnalysis.daily_operations_cost,
      monthly: costAnalysis.monthly_projected,
      savings: costAnalysis.annual_savings
    } : {
      daily: 2847.50,
      monthly: 89432.20,
      savings: 245680.00
    }
  } : {
    // Fallback data when API is not available
    overallHealth: 96,
    activeAgents: 47,
    totalAgents: 52,
    runningWorkflows: 23,
    completedToday: 187,
    averageResponseTime: 1.2,
    successRate: 98.4,
    resourceUtilization: {
      cpu: 34,
      memory: 67,
      storage: 23,
      network: 45
    },
    costs: {
      daily: 2847.50,
      monthly: 89432.20,
      savings: 245680.00
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const [healthData, costData, deptData] = await Promise.all([
        enterpriseAPI.getSystemHealth(),
        enterpriseAPI.getCostAnalysis(),
        enterpriseAPI.getDepartmentPerformance()
      ]);
      
      setSystemHealth(healthData);
      setCostAnalysis(costData);
      setDepartmentPerformance(deptData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const alerts: AlertItem[] = [
    {
      id: 'alert-1',
      type: 'warning',
      title: 'High Memory Usage',
      message: 'Analytics Agent approaching memory limits',
      timestamp: '2 minutes ago',
      agent: 'Analytics Agent',
      acknowledged: false
    },
    {
      id: 'alert-2',
      type: 'info',
      title: 'Workflow Completed',
      message: 'Employee onboarding workflow finished successfully',
      timestamp: '5 minutes ago',
      workflow: 'Employee Onboarding',
      acknowledged: false
    },
    {
      id: 'alert-3',
      type: 'success',
      title: 'Performance Milestone',
      message: 'System achieved 99% uptime this month',
      timestamp: '1 hour ago',
      acknowledged: true
    }
  ];

  const departments: DepartmentStats[] = [
    {
      id: 'hr',
      name: 'Human Resources',
      icon: <Group />,
      agentsActive: 8,
      workflowsToday: 34,
      efficiency: 94,
      costSavings: 67500,
      status: 'optimal'
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: <AccountBalance />,
      agentsActive: 12,
      workflowsToday: 67,
      efficiency: 91,
      costSavings: 123400,
      status: 'good'
    },
    {
      id: 'it',
      name: 'IT Operations',
      icon: <Engineering />,
      agentsActive: 15,
      workflowsToday: 28,
      efficiency: 97,
      costSavings: 89600,
      status: 'optimal'
    },
    {
      id: 'security',
      name: 'Security',
      icon: <Security />,
      agentsActive: 6,
      workflowsToday: 15,
      efficiency: 99,
      costSavings: 45200,
      status: 'optimal'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: <Assessment />,
      agentsActive: 4,
      workflowsToday: 89,
      efficiency: 88,
      costSavings: 78300,
      status: 'attention'
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: <Settings />,
      agentsActive: 2,
      workflowsToday: 12,
      efficiency: 95,
      costSavings: 34500,
      status: 'good'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return theme.palette.success.main;
      case 'good': return theme.palette.info.main;
      case 'attention': return theme.palette.warning.main;
      case 'critical': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <Warning sx={{ color: theme.palette.error.main }} />;
      case 'warning': return <Warning sx={{ color: theme.palette.warning.main }} />;
      case 'info': return <CheckCircle sx={{ color: theme.palette.info.main }} />;
      case 'success': return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      default: return <CheckCircle />;
    }
  };

  const handleSystemControl = (action: 'pause' | 'resume' | 'maintenance') => {
    console.log(`System action: ${action}`);
    // Implementation would handle system-wide controls
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with System Status */}
      <Box sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="body1" color="text.secondary">
              Autonomous Enterprise Operating System - Real-time Intelligence Dashboard
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {/* System Status Indicator */}
            <Paper sx={{ px: 2, py: 1, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ElectricBolt sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                </motion.div>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  System {systemStatus === 'running' ? 'Operational' : 'Maintenance'}
                </Typography>
                <Chip 
                  label={`${metrics.overallHealth}% Health`}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main
                  }}
                />
              </Stack>
            </Paper>

            {/* System Controls */}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Pause All Workflows">
                <IconButton 
                  onClick={() => handleSystemControl('pause')}
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) }
                  }}
                >
                  <Pause />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Dashboard">
                <IconButton 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>

        {/* Timeframe Selector */}
        <Stack direction="row" spacing={1}>
          {['1h', '24h', '7d', '30d'].map((timeframe) => (
            <Chip
              key={timeframe}
              label={timeframe}
              clickable
              variant={selectedTimeframe === timeframe ? 'filled' : 'outlined'}
              onClick={() => setSelectedTimeframe(timeframe as typeof selectedTimeframe)}
              sx={{
                backgroundColor: selectedTimeframe === timeframe 
                  ? alpha(theme.palette.primary.main, 0.1) 
                  : 'transparent'
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {/* Key Metrics Row */}
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} mb={3}>
          {/* Left Column - System Overview */}
          <Box sx={{ flex: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              System Overview
            </Typography>
            
            {/* Core Metrics Cards */}
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 3
              }}
            >
              <Card sx={{ textAlign: 'center', border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                <CardContent sx={{ p: 2 }}>
                  <SmartToy sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {metrics.activeAgents}/{metrics.totalAgents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Agents
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ textAlign: 'center', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                <CardContent sx={{ p: 2 }}>
                  <AutoAwesome sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {metrics.runningWorkflows}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Running Workflows
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ textAlign: 'center', border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                <CardContent sx={{ p: 2 }}>
                  <CheckCircle sx={{ fontSize: 32, color: theme.palette.info.main, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    {metrics.completedToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Today
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ textAlign: 'center', border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
                <CardContent sx={{ p: 2 }}>
                  <Speed sx={{ fontSize: 32, color: theme.palette.secondary.main, mb: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                    {metrics.averageResponseTime}s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Resource Utilization */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Resource Utilization
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(metrics.resourceUtilization).map(([resource, usage]) => {
                    const icons = {
                      cpu: <Psychology />,
                      memory: <Memory />,
                      storage: <Storage />,
                      network: <CloudQueue />
                    };
                    
                    return (
                      <Box key={resource}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {icons[resource as keyof typeof icons]}
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {resource}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {usage}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={usage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.divider, 0.2),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: usage > 80 
                                ? theme.palette.error.main 
                                : usage > 60 
                                  ? theme.palette.warning.main 
                                  : theme.palette.success.main
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>

            {/* Cost Analysis */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Cost Analysis
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Daily Operating Cost</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(metrics.costs.daily)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Monthly Projection</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(metrics.costs.monthly)}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                      Estimated Annual Savings
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(metrics.costs.savings)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Alerts & Departments */}
          <Box sx={{ flex: 1 }}>
            {/* Active Alerts */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Active Alerts
                  </Typography>
                  <Badge badgeContent={alerts.filter(a => !a.acknowledged).length} color="error">
                    <Notifications />
                  </Badge>
                </Stack>
                
                <Stack spacing={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      severity={alert.type}
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.875rem',
                        opacity: alert.acknowledged ? 0.7 : 1
                      }}
                      icon={getAlertIcon(alert.type)}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {alert.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.message} • {alert.timestamp}
                        </Typography>
                      </Box>
                    </Alert>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Department Status */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Department Performance
                </Typography>
                
                <Stack spacing={2}>
                  {departments.map((dept) => (
                    <Paper 
                      key={dept.id}
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        border: `1px solid ${alpha(getStatusColor(dept.status), 0.2)}`,
                        backgroundColor: alpha(getStatusColor(dept.status), 0.02)
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(getStatusColor(dept.status), 0.1),
                            color: getStatusColor(dept.status)
                          }}
                        >
                          {dept.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {dept.name}
                          </Typography>
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                            <Typography variant="caption">
                              {dept.agentsActive} agents
                            </Typography>
                            <Typography variant="caption">
                              {dept.workflowsToday} workflows
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                              {formatCurrency(dept.costSavings)} saved
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack alignItems="center">
                          <Typography variant="h6" sx={{ fontWeight: 700, color: getStatusColor(dept.status) }}>
                            {dept.efficiency}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            efficiency
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default EnterpriseCommandCenter;
