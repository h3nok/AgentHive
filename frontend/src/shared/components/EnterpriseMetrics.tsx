import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  status,
  icon,
  description
}) => {
  const theme = useTheme();
  
  const statusColors = {
    excellent: theme.palette.success.main,
    good: theme.palette.info.main,
    warning: theme.palette.warning.main,
    critical: theme.palette.error.main,
  };

  const statusBg = {
    excellent: alpha(theme.palette.success.main, 0.1),
    good: alpha(theme.palette.info.main, 0.1),
    warning: alpha(theme.palette.warning.main, 0.1),
    critical: alpha(theme.palette.error.main, 0.1),
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: statusBg[status],
        border: `1px solid ${alpha(statusColors[status], 0.3)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(statusColors[status], 0.2)}`,
        }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ color: statusColors[status] }}>
            {icon}
          </Box>
          <Chip
            label={status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: statusColors[status],
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        </Stack>
        
        <Typography variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
          {value}
          {unit && (
            <Typography component="span" variant="h6" sx={{ ml: 0.5, opacity: 0.7 }}>
              {unit}
            </Typography>
          )}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
        
        {trend !== undefined && (
          <Stack direction="row" alignItems="center" sx={{ mt: 1 }}>
            <TrendingUpIcon 
              fontSize="small" 
              sx={{ 
                color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main,
                transform: trend < 0 ? 'rotate(180deg)' : 'none',
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                ml: 0.5,
                color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main,
                fontWeight: 600
              }}
            >
              {trend >= 0 ? '+' : ''}{trend}% vs last hour
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

interface EnterpriseMetricsProps {
  className?: string;
}

const EnterpriseMetrics: React.FC<EnterpriseMetricsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<{
    responseTime: { value: number; status: 'excellent' | 'good' | 'warning' | 'critical'; trend: number };
    throughput: { value: number; status: 'excellent' | 'good' | 'warning' | 'critical'; trend: number };
    errorRate: { value: number; status: 'excellent' | 'good' | 'warning' | 'critical'; trend: number };
    memoryUsage: { value: number; status: 'excellent' | 'good' | 'warning' | 'critical'; trend: number };
    activeAgents: { value: number; status: 'excellent' | 'good' | 'warning' | 'critical'; trend: number };
    securityScore: { value: number; status: 'excellent' | 'good' | 'warning' | 'critical'; trend: number };
  }>({
    responseTime: { value: 247, status: 'good', trend: -12 },
    throughput: { value: 1247, status: 'excellent', trend: 8 },
    errorRate: { value: 0.02, status: 'excellent', trend: -45 },
    memoryUsage: { value: 68, status: 'warning', trend: 3 },
    activeAgents: { value: 12, status: 'good', trend: 0 },
    securityScore: { value: 98, status: 'excellent', trend: 2 },
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refreshMetrics = () => {
    // Simulate real-time metrics updates
    setMetrics(prev => ({
      responseTime: {
        value: Math.round(200 + Math.random() * 100),
        status: Math.random() > 0.8 ? 'warning' : 'good',
        trend: Math.round((Math.random() - 0.5) * 30)
      },
      throughput: {
        value: Math.round(1000 + Math.random() * 500),
        status: 'excellent',
        trend: Math.round((Math.random() - 0.3) * 20)
      },
      errorRate: {
        value: Number((Math.random() * 0.1).toFixed(3)),
        status: Math.random() > 0.9 ? 'warning' : 'excellent',
        trend: Math.round((Math.random() - 0.6) * 50)
      },
      memoryUsage: {
        value: Math.round(50 + Math.random() * 40),
        status: Math.random() > 0.7 ? 'warning' : 'good',
        trend: Math.round((Math.random() - 0.4) * 15)
      },
      activeAgents: {
        value: Math.round(8 + Math.random() * 8),
        status: 'good',
        trend: Math.round((Math.random() - 0.5) * 10)
      },
      securityScore: {
        value: Math.round(95 + Math.random() * 5),
        status: 'excellent',
        trend: Math.round((Math.random() - 0.3) * 5)
      }
    }));
    setLastUpdated(new Date());
  };

  useEffect(() => {
    const interval = setInterval(refreshMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Box className={className}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Enterprise Performance Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time system monitoring and analytics
          </Typography>
        </Box>
        
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Metrics">
            <IconButton onClick={refreshMetrics} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* @ts-ignore - MUI Grid v7 compatibility issue */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Average Response Time"
            value={metrics.responseTime.value}
            unit="ms"
            status={metrics.responseTime.status}
            trend={metrics.responseTime.trend}
            icon={<SpeedIcon />}
            description="API and model response latency"
          />
        </Grid>
        
        {/* @ts-ignore - MUI Grid v7 compatibility issue */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Request Throughput"
            value={metrics.throughput.value}
            unit="/hr"
            status={metrics.throughput.status}
            trend={metrics.throughput.trend}
            icon={<AssessmentIcon />}
            description="Requests processed per hour"
          />
        </Grid>
        
        {/* @ts-ignore - MUI Grid v7 compatibility issue */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Error Rate"
            value={metrics.errorRate.value}
            unit="%"
            status={metrics.errorRate.status}
            trend={metrics.errorRate.trend}
            icon={<NetworkIcon />}
            description="Failed requests percentage"
          />
        </Grid>
        
        {/* @ts-ignore - MUI Grid v7 compatibility issue */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Memory Usage"
            value={metrics.memoryUsage.value}
            unit="%"
            status={metrics.memoryUsage.status}
            trend={metrics.memoryUsage.trend}
            icon={<MemoryIcon />}
            description="System memory utilization"
          />
        </Grid>
        
        {/* @ts-ignore - MUI Grid v7 compatibility issue */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Active Agents"
            value={metrics.activeAgents.value}
            status={metrics.activeAgents.status}
            trend={metrics.activeAgents.trend}
            icon={<TrendingUpIcon />}
            description="Currently running AI agents"
          />
        </Grid>
        
        {/* @ts-ignore - MUI Grid v7 compatibility issue */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Security Score"
            value={metrics.securityScore.value}
            unit="/100"
            status={metrics.securityScore.status}
            trend={metrics.securityScore.trend}
            icon={<SecurityIcon />}
            description="Overall security posture"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnterpriseMetrics;
