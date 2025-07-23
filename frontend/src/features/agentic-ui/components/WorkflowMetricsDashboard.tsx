/**
 * Workflow Metrics Dashboard
 * 
 * Real-time metrics and analytics for workflow performance,
 * cost tracking, and enterprise insights.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Speed,
  Memory,
  CheckCircle,
  Error,
  Schedule,
  Analytics,
  Refresh,
  Timeline,
  Build,
  Psychology
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { AgenticWorkflow } from '../types';

// Animations
const countUp = keyframes`
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const pulseGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
`;

const pulseRed = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
`;

// Styled Components
const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 193, 7, 0.02) 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  }
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  animation: `${countUp} 0.5s ease-out`,
}));

const TrendIndicator = styled(Box)<{ trend: 'up' | 'down' | 'neutral' }>(({ theme, trend }) => ({
  display: 'flex',
  alignItems: 'center',
  color: trend === 'up' ? theme.palette.success.main : 
         trend === 'down' ? theme.palette.error.main : 
         theme.palette.text.secondary,
}));

const StatusIndicator = styled(Box)<{ status: 'success' | 'error' | 'warning' }>(({ theme, status }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: status === 'success' ? theme.palette.success.main :
                   status === 'error' ? theme.palette.error.main :
                   theme.palette.warning.main,
  animation: status === 'success' ? `${pulseGreen} 2s infinite` :
             status === 'error' ? `${pulseRed} 2s infinite` : 'none',
}));

interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  avgExecutionTime: number;
  totalCost: number;
  totalTokens: number;
  successRate: number;
  costPerWorkflow: number;
  tokensPerWorkflow: number;
  trends: {
    workflows: 'up' | 'down' | 'neutral';
    cost: 'up' | 'down' | 'neutral';
    performance: 'up' | 'down' | 'neutral';
  };
}

interface WorkflowMetricsDashboardProps {
  workflow?: AgenticWorkflow;
  realTimeUpdates?: boolean;
  compact?: boolean;
}

const WorkflowMetricsDashboard: React.FC<WorkflowMetricsDashboardProps> = ({
  workflow,
  realTimeUpdates = true,
  compact = false
}) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<WorkflowMetrics>({
    totalWorkflows: 247,
    activeWorkflows: 3,
    completedWorkflows: 231,
    failedWorkflows: 13,
    avgExecutionTime: 45.2,
    totalCost: 12.47,
    totalTokens: 45230,
    successRate: 93.5,
    costPerWorkflow: 0.05,
    tokensPerWorkflow: 183,
    trends: {
      workflows: 'up',
      cost: 'down',
      performance: 'up'
    }
  });

  const [autoRefresh, setAutoRefresh] = useState(realTimeUpdates);

  // Simulate real-time updates
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          activeWorkflows: Math.max(0, prev.activeWorkflows + (Math.random() > 0.5 ? 1 : -1)),
          totalCost: prev.totalCost + (Math.random() * 0.1),
          totalTokens: prev.totalTokens + Math.floor(Math.random() * 50),
          avgExecutionTime: prev.avgExecutionTime + (Math.random() - 0.5) * 2,
        }));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatTime = (seconds: number) => `${seconds.toFixed(1)}s`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const metricCards = [
    {
      title: 'Active Workflows',
      value: metrics.activeWorkflows,
      formatter: formatNumber,
      icon: <Timeline color="primary" />,
      trend: metrics.trends.workflows,
      trendValue: '+12%',
      color: 'primary'
    },
    {
      title: 'Success Rate',
      value: metrics.successRate,
      formatter: formatPercentage,
      icon: <CheckCircle color="success" />,
      trend: metrics.trends.performance,
      trendValue: '+2.3%',
      color: 'success'
    },
    {
      title: 'Avg Execution Time',
      value: metrics.avgExecutionTime,
      formatter: formatTime,
      icon: <Speed color="info" />,
      trend: metrics.trends.performance,
      trendValue: '-5.2%',
      color: 'info'
    },
    {
      title: 'Total Cost',
      value: metrics.totalCost,
      formatter: formatCurrency,
      icon: <AttachMoney color="warning" />,
      trend: metrics.trends.cost,
      trendValue: '-8.1%',
      color: 'warning'
    },
    {
      title: 'Total Tokens',
      value: metrics.totalTokens,
      formatter: formatNumber,
      icon: <Memory color="secondary" />,
      trend: 'up',
      trendValue: '+15%',
      color: 'secondary'
    },
    {
      title: 'Cost per Workflow',
      value: metrics.costPerWorkflow,
      formatter: formatCurrency,
      icon: <Analytics color="error" />,
      trend: metrics.trends.cost,
      trendValue: '-12%',
      color: 'error'
    }
  ];

  // Current workflow specific metrics
  const currentWorkflowMetrics = workflow ? {
    progress: workflow.progress.overall,
    currentStep: workflow.progress.currentStep,
    totalSteps: workflow.progress.totalSteps,
    cost: workflow.metrics.totalCost,
    tokens: workflow.metrics.totalTokens,
    duration: workflow.metrics.totalDuration,
    toolsUsed: workflow.metrics.toolsUsed.length,
    status: workflow.status
  } : null;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Workflow Metrics
        </Typography>
        
        <Stack direction="row" alignItems="center" spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto-refresh"
            sx={{ mr: 1 }}
          />
          
          <Tooltip title="Refresh metrics">
            <IconButton size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Current Workflow Status */}
      {currentWorkflowMetrics && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Current Workflow: {workflow?.name}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {currentWorkflowMetrics.progress}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Progress
                </Typography>
              </Stack>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center">
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {currentWorkflowMetrics.currentStep}/{currentWorkflowMetrics.totalSteps}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Steps
                </Typography>
              </Stack>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {formatCurrency(currentWorkflowMetrics.cost)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cost
                </Typography>
              </Stack>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center" spacing={1}>
                <StatusIndicator status={
                  currentWorkflowMetrics.status === 'completed' ? 'success' :
                  currentWorkflowMetrics.status === 'error' ? 'error' : 'warning'
                } />
                <Typography variant="caption" color="text.secondary">
                  {currentWorkflowMetrics.status}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          
          <LinearProgress
            variant="determinate"
            value={currentWorkflowMetrics.progress}
            sx={{ mt: 2, height: 6, borderRadius: 3 }}
          />
        </Paper>
      )}

      {/* Metrics Grid */}
      <Grid container spacing={2}>
        {metricCards.map((metric, index) => (
          <Grid item xs={12} sm={6} md={compact ? 6 : 4} key={metric.title}>
            <MetricCard>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: `${metric.color}.light` }}>
                    {metric.icon}
                  </Avatar>
                  
                  <TrendIndicator trend={metric.trend}>
                    {metric.trend === 'up' ? <TrendingUp /> : 
                     metric.trend === 'down' ? <TrendingDown /> : null}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {metric.trendValue}
                    </Typography>
                  </TrendIndicator>
                </Stack>
                
                <MetricValue color={`${metric.color}.main`}>
                  {metric.formatter(metric.value)}
                </MetricValue>
                
                <Typography variant="body2" color="text.secondary">
                  {metric.title}
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
        ))}
      </Grid>

      {/* Summary Stats */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
          Summary Statistics
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Completed</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {metrics.completedWorkflows}
                </Typography>
              </Stack>
              
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Failed</Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {metrics.failedWorkflows}
                </Typography>
              </Stack>
              
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {metrics.totalWorkflows}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Tokens/Workflow</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {metrics.tokensPerWorkflow}
                </Typography>
              </Stack>
              
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Cost/Workflow</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(metrics.costPerWorkflow)}
                </Typography>
              </Stack>
              
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Efficiency</Typography>
                <Chip
                  label="Excellent"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Performance Trends
              </Typography>
              
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<TrendingUp />}
                  label="Throughput"
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<TrendingDown />}
                  label="Cost"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Stack>
              
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default WorkflowMetricsDashboard;
