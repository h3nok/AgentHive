import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Button,
  Alert,
  useTheme,
  alpha,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Groups,
  AccountTree,
  Speed,
  Memory,
  TrendingUp,
  Settings,
  Refresh,
  Hub,
  ElectricBolt,
  Timeline
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface SwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  tasksCompleted: number;
  averageResponseTime: number;
  efficiency: number;
  networkHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

const SwarmDashboard = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<SwarmMetrics>({
    totalAgents: 12,
    activeAgents: 8,
    tasksCompleted: 247,
    averageResponseTime: 1.2,
    efficiency: 87,
    networkHealth: 'good'
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshMetrics = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMetrics(prev => ({
        ...prev,
        activeAgents: Math.floor(Math.random() * prev.totalAgents) + 1,
        tasksCompleted: prev.tasksCompleted + Math.floor(Math.random() * 10),
        efficiency: Math.floor(Math.random() * 20) + 80,
        averageResponseTime: Math.random() * 2 + 0.5
      }));
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return theme.palette.success.main;
      case 'good': return theme.palette.info.main;
      case 'warning': return theme.palette.warning.main;
      case 'critical': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: string;
    progress?: number;
  }> = ({ title, value, subtitle, icon, color, progress }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color || theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          border: `1px solid ${alpha(color || theme.palette.primary.main, 0.1)}`,
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                color: color || theme.palette.primary.main,
              }}
            >
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
          {progress !== undefined && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color || theme.palette.primary.main,
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh Metrics">
              <IconButton
                onClick={refreshMetrics}
                disabled={isLoading}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                  },
                }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Network Health Alert */}
      {metrics.networkHealth === 'warning' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Swarm network performance is below optimal. Consider scaling resources.
        </Alert>
      )}

      {/* Metrics Cards */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 3
      }}>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <MetricCard
            title="Total Agents"
            value={metrics.totalAgents}
            subtitle="Configured in swarm"
            icon={<Groups />}
            color={theme.palette.primary.main}
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <MetricCard
            title="Active Agents"
            value={metrics.activeAgents}
            subtitle={`${Math.round((metrics.activeAgents / metrics.totalAgents) * 100)}% operational`}
            icon={<Hub />}
            color={theme.palette.success.main}
            progress={(metrics.activeAgents / metrics.totalAgents) * 100}
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <MetricCard
            title="Tasks Completed"
            value={metrics.tasksCompleted}
            subtitle="Today"
            icon={<TrendingUp />}
            color={theme.palette.info.main}
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <MetricCard
            title="Avg Response Time"
            value={`${metrics.averageResponseTime.toFixed(1)}s`}
            subtitle="Last 24 hours"
            icon={<Speed />}
            color={theme.palette.warning.main}
          />
        </Box>
      </Box>

      {/* Additional Metrics */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mt: 2
      }}>
        <Box sx={{ flex: '2 1 500px', minWidth: 500 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Swarm Efficiency
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">Overall Performance</Typography>
                  <Typography variant="h6">{metrics.efficiency}%</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={metrics.efficiency}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
              </Box>
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`Network: ${metrics.networkHealth}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(getHealthColor(metrics.networkHealth), 0.1),
                    color: getHealthColor(metrics.networkHealth),
                  }}
                />
                <Chip
                  label={isLoading ? 'Updating...' : 'Live'}
                  size="small"
                  color={isLoading ? 'default' : 'success'}
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<AccountTree />}
                  fullWidth
                  disabled={isLoading}
                >
                  View Agent Network
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Timeline />}
                  fullWidth
                  disabled={isLoading}
                >
                  Performance History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ElectricBolt />}
                  fullWidth
                  disabled={isLoading}
                >
                  Scale Resources
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default SwarmDashboard;
