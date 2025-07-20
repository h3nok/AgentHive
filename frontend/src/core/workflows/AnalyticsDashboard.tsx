import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  Memory,
  Psychology,
  Assessment,
  Refresh,
  Download,
  Analytics,
  BarChart,
  PieChart,
  ShowChart
} from '@mui/icons-material';
import { DashboardGrid, DashboardCardProps } from '../../shared/components/dashboard';

const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Mock data for analytics dashboard
  const mockSystemMetrics = {
    totalAgents: 5,
    activeAgents: 3,
    totalQueries: 12456,
    avgResponseTime: 145,
    successRate: 98.5,
    tokensUsed: 234567,
    cost: 45.67,
    uptime: 99.98,
    errorRate: 0.02
  };

  const mockAgentMetrics = [
    {
      agentId: 'general',
      agentName: 'General Assistant',
      totalQueries: 1456,
      successRate: 98.5,
      avgResponseTime: 1200,
      tokensUsed: 45000,
      errorRate: 0.015,
      uptime: 99.9,
      lastActivity: '2 min ago',
      trend: 'up' as const,
      status: 'active' as const
    },
    {
      agentId: 'technical',
      agentName: 'Technical Expert',
      totalQueries: 890,
      successRate: 96.2,
      avgResponseTime: 1450,
      tokensUsed: 32000,
      errorRate: 0.038,
      uptime: 98.7,
      lastActivity: '5 min ago',
      trend: 'stable' as const,
      status: 'active' as const
    },
    {
      agentId: 'support',
      agentName: 'Support Agent',
      totalQueries: 2103,
      successRate: 99.1,
      avgResponseTime: 980,
      tokensUsed: 58000,
      errorRate: 0.009,
      uptime: 99.8,
      lastActivity: '1 min ago',
      trend: 'up' as const,
      status: 'active' as const
    }
  ];

  // Helper functions
  const formatValue = useCallback((value: number, type: 'percentage' | 'currency' | 'time' | 'number' = 'number') => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'time':
        return value > 1000 ? `${(value / 1000).toFixed(1)}s` : `${value.toFixed(0)}ms`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  }, []);

  const getTrendIcon = useCallback((trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
      case 'down': return <TrendingDown sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
      case 'stable': return <span style={{ width: 16, height: 16, display: 'inline-block' }} />;
    }
  }, [theme]);

  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'system': return theme.palette.primary.main;
      case 'agents': return theme.palette.secondary.main;
      case 'performance': return theme.palette.info.main;
      case 'costs': return theme.palette.warning.main;
      default: return theme.palette.primary.main;
    }
  }, [theme]);

  // Dashboard cards configuration
  const dashboardCards: DashboardCardProps[] = useMemo(() => [
    {
      id: 'system-overview',
      title: 'System Overview',
      defaultLayout: { x: 0, y: 0, w: 6, h: 4 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              System Metrics
            </Typography>
            <IconButton size="small" onClick={() => console.log('Refresh system metrics')}>
              <Refresh fontSize="small" />
            </IconButton>
          </Box>
          
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Total Agents</Typography>
              <Typography variant="body2" fontWeight={600}>{mockSystemMetrics.totalAgents}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Active Agents</Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {mockSystemMetrics.activeAgents}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Total Queries</Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatValue(mockSystemMetrics.totalQueries)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Success Rate</Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {formatValue(mockSystemMetrics.successRate, 'percentage')}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Avg Response Time</Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatValue(mockSystemMetrics.avgResponseTime, 'time')}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      )
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      defaultLayout: { x: 6, y: 0, w: 6, h: 4 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Performance
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<Speed fontSize="small" />}
                label={`${formatValue(mockSystemMetrics.avgResponseTime, 'time')} avg`}
                size="small"
                sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1) }}
              />
            </Stack>
          </Box>
          
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Uptime</Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {formatValue(mockSystemMetrics.uptime, 'percentage')}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Error Rate</Typography>
              <Typography variant="body2" fontWeight={600} color="error.main">
                {formatValue(mockSystemMetrics.errorRate, 'percentage')}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Tokens Used</Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatValue(mockSystemMetrics.tokensUsed)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Total Cost</Typography>
              <Typography variant="body2" fontWeight={600} color="warning.main">
                {formatValue(mockSystemMetrics.cost, 'currency')}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      )
    },
    {
      id: 'agent-performance',
      title: 'Agent Performance',
      defaultLayout: { x: 0, y: 4, w: 12, h: 6 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Individual Agent Metrics
            </Typography>
            <Button
              startIcon={<Download />}
              size="small"
              onClick={() => console.log('Export agent metrics')}
              sx={{ textTransform: 'none' }}
            >
              Export
            </Button>
          </Box>
          
          <Stack spacing={2}>
            {mockAgentMetrics.map((agent) => (
              <Box
                key={agent.agentId}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {agent.agentName}
                    </Typography>
                    {getTrendIcon(agent.trend)}
                  </Box>
                  <Chip
                    label={agent.status}
                    size="small"
                    color={agent.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
                
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Queries</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatValue(agent.totalQueries)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Success Rate</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {formatValue(agent.successRate, 'percentage')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Avg Response</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatValue(agent.avgResponseTime, 'time')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Last Activity</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {agent.lastActivity}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      )
    },
    {
      id: 'cost-analysis',
      title: 'Cost Analysis',
      defaultLayout: { x: 0, y: 10, w: 6, h: 4 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Cost Breakdown
            </Typography>
            <IconButton size="small" onClick={() => console.log('Refresh cost data')}>
              <BarChart fontSize="small" />
            </IconButton>
          </Box>
          
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Total Cost (24h)</Typography>
              <Typography variant="h6" fontWeight={600} color="warning.main">
                {formatValue(mockSystemMetrics.cost, 'currency')}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Cost per Query</Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatValue(mockSystemMetrics.cost / mockSystemMetrics.totalQueries, 'currency')}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Token Cost</Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatValue(mockSystemMetrics.tokensUsed * 0.0001, 'currency')}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      )
    },
    {
      id: 'analytics-insights',
      title: 'Analytics Insights',
      defaultLayout: { x: 6, y: 10, w: 6, h: 4 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Key Insights
            </Typography>
            <IconButton size="small" onClick={() => console.log('View detailed analytics')}>
              <ShowChart fontSize="small" />
            </IconButton>
          </Box>
          
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}
            >
              <Typography variant="body2" fontWeight={600} color="success.main">
                High Performance
              </Typography>
              <Typography variant="caption" color="text.secondary">
                System running at {formatValue(mockSystemMetrics.successRate, 'percentage')} success rate
              </Typography>
            </Box>
            
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <Typography variant="body2" fontWeight={600} color="info.main">
                Optimal Response Time
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Average {formatValue(mockSystemMetrics.avgResponseTime, 'time')} response time
              </Typography>
            </Box>
            
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}
            >
              <Typography variant="body2" fontWeight={600} color="warning.main">
                Cost Efficiency
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatValue(mockSystemMetrics.cost / mockSystemMetrics.totalQueries, 'currency')} per query
              </Typography>
            </Box>
          </Stack>
        </Stack>
      )
    }
  ], [theme, mockSystemMetrics, mockAgentMetrics, formatValue, getTrendIcon]);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          p: 3,
          borderRadius: 2,
          mb: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Analytics sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Analytics Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitor system performance, agent metrics, and cost analysis
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<Refresh />}
              onClick={() => console.log('Refresh all metrics')}
              sx={{ textTransform: 'none' }}
            >
              Refresh
            </Button>
            <Button
              startIcon={<Download />}
              onClick={() => console.log('Export analytics')}
              sx={{ textTransform: 'none' }}
            >
              Export
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Dashboard Grid */}
      <DashboardGrid
        cards={dashboardCards}
        onLayoutChange={(layout) => {
          console.log('Analytics Dashboard layout changed:', layout);
        }}
      />
    </Box>
  );
};

export default AnalyticsDashboard;
