import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Button,
  Alert,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Groups,
  AccountTree,
  Speed,
  TrendingUp,
  Settings,
  Refresh,
  Hub,
  ElectricBolt,
  Timeline
} from '@mui/icons-material';
import { DashboardGrid, DashboardCardProps } from '../../../shared/components/dashboard';

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

  const dashboardCards: DashboardCardProps[] = [
    // Total Agents Metric
    {
      id: 'total-agents',
      title: 'Total Agents',
      defaultLayout: { x: 0, y: 0, w: 3, h: 4 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Groups sx={{ color: theme.palette.primary.main, fontSize: '2rem' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {metrics.totalAgents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configured in swarm
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    // Active Agents Metric
    {
      id: 'active-agents',
      title: 'Active Agents',
      defaultLayout: { x: 3, y: 0, w: 3, h: 4 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Hub sx={{ color: theme.palette.success.main, fontSize: '2rem' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {metrics.activeAgents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round((metrics.activeAgents / metrics.totalAgents) * 100)}% operational
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(metrics.activeAgents / metrics.totalAgents) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: theme.palette.success.main,
              },
            }}
          />
        </Box>
      ),
    },
    // Tasks Completed Metric
    {
      id: 'tasks-completed',
      title: 'Tasks Completed',
      defaultLayout: { x: 6, y: 0, w: 3, h: 4 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUp sx={{ color: '#f59e0b', fontSize: '2rem' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                {metrics.tasksCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    // Response Time Metric
    {
      id: 'response-time',
      title: 'Avg Response Time',
      defaultLayout: { x: 9, y: 0, w: 3, h: 4 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Speed sx={{ color: theme.palette.warning.main, fontSize: '2rem' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                {metrics.averageResponseTime.toFixed(1)}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 24 hours
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    // Swarm Efficiency
    {
      id: 'swarm-efficiency',
      title: 'Swarm Efficiency',
      defaultLayout: { x: 0, y: 4, w: 8, h: 6 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
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
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: theme.palette.primary.main,
                },
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
        </Box>
      ),
    },
    // Quick Actions
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      defaultLayout: { x: 8, y: 4, w: 4, h: 6 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={<AccountTree />}
              fullWidth
              disabled={isLoading}
              sx={{ justifyContent: 'flex-start' }}
            >
              View Agent Network
            </Button>
            <Button
              variant="outlined"
              startIcon={<Timeline />}
              fullWidth
              disabled={isLoading}
              sx={{ justifyContent: 'flex-start' }}
            >
              Performance History
            </Button>
            <Button
              variant="outlined"
              startIcon={<ElectricBolt />}
              fullWidth
              disabled={isLoading}
              sx={{ justifyContent: 'flex-start' }}
            >
              Scale Resources
            </Button>
          </Stack>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            🐝 Swarm Intelligence Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage your agent swarm performance in real-time
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={refreshMetrics}
              disabled={isLoading}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <Refresh sx={{ 
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton>
              <Settings />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Status Alert */}
      {metrics.networkHealth === 'critical' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Critical network health detected. Some agents may be experiencing issues.
        </Alert>
      )}
      {metrics.networkHealth === 'warning' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Network performance is below optimal. Monitor agent activity closely.
        </Alert>
      )}

      {/* Dashboard Grid with Draggable/Resizable Cards */}
      <DashboardGrid
        cards={dashboardCards}
        cols={{
          lg: 12,
          md: 10,
          sm: 6,
          xs: 4,
          xxs: 2,
        }}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={(_, layouts) => {
          // Save layout preferences to localStorage or backend
          console.log('Swarm dashboard layout changed:', layouts);
        }}
      />

    </Box>
  );
};

export default SwarmDashboard;
