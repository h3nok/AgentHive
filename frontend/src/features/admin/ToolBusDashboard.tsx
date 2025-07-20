import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import {
  Memory,
  Speed,
  Timeline,
  NetworkCheck,
} from '@mui/icons-material';
import { DashboardGrid, DashboardCardProps } from '../../shared/components/dashboard';
import { MetricCard } from '../../shared/components/dashboard/cards/MetricCard';
import { ActivityCard } from '../../shared/components/dashboard/cards/ActivityCard';
import { StatusCard } from '../../shared/components/dashboard/cards/StatusCard';

interface ToolBusMetrics {
  messagesPerSecond: number;
  totalMessages: number;
  activeConnections: number;
  avgLatency: number;
  errorRate: number;
  memoryUsage: number;
  uptime: string;
}

const ToolBusDashboard: React.FC = () => {
  const theme = useTheme();
  
  const [metrics, setMetrics] = useState<ToolBusMetrics>({
    messagesPerSecond: 1247,
    totalMessages: 892456,
    activeConnections: 23,
    avgLatency: 89,
    errorRate: 0.12,
    memoryUsage: 67,
    uptime: '15d 7h 23m'
  });
  
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    if (!realTimeEnabled) return;
    
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        messagesPerSecond: prev.messagesPerSecond + Math.floor(Math.random() * 20 - 10),
        avgLatency: Math.max(50, prev.avgLatency + Math.floor(Math.random() * 10 - 5)),
        memoryUsage: Math.max(30, Math.min(90, prev.memoryUsage + Math.floor(Math.random() * 4 - 2)))
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const systemHealth = Math.round(
    (100 - metrics.avgLatency / 10) * 0.4 + 
    (100 - metrics.errorRate) * 0.3 + 
    (100 - metrics.memoryUsage) * 0.3
  );

  const dashboardCards: DashboardCardProps[] = [
    {
      id: 'messages-processed',
      title: 'Messages Processed',
      defaultLayout: { x: 0, y: 0, w: 3, h: 4 },
      children: (
        <MetricCard
          title="Messages Processed"
          value={metrics.totalMessages.toLocaleString()}
          unit="/hour"
          trend="up"
          trendValue="+12%"
          description="Total messages processed through NATS JetStream"
          icon={<Timeline />}
          color="warning"
          status="warning"
          animated={realTimeEnabled}
        />
      ),
    },
    {
      id: 'active-connections',
      title: 'Active Connections', 
      defaultLayout: { x: 3, y: 0, w: 3, h: 4 },
      children: (
        <MetricCard
          title="Active Connections"
          value={metrics.activeConnections}
          trend="stable"
          description="Current active NATS connections"
          icon={<NetworkCheck />}
          color="warning"
          status="warning"
          animated={realTimeEnabled}
        />
      ),
    },
    {
      id: 'avg-latency',
      title: 'Average Latency',
      defaultLayout: { x: 6, y: 0, w: 3, h: 4 },
      children: (
        <MetricCard
          title="Average Latency"
          value={metrics.avgLatency}
          unit="ms"
          trend="down"
          trendValue="-5%"
          description="Average message processing latency"
          icon={<Speed />}
          color="warning"
          status="warning"
          progress={75}
          animated={realTimeEnabled}
        />
      ),
    },
    {
      id: 'memory-usage',
      title: 'Memory Usage',
      defaultLayout: { x: 9, y: 0, w: 3, h: 4 },
      children: (
        <MetricCard
          title="Memory Usage"
          value={`${metrics.memoryUsage}%`}
          trend="up"
          trendValue="+2%"
          description="Current memory utilization"
          icon={<Memory />}
          color="warning"
          status={metrics.memoryUsage > 80 ? 'warning' : 'healthy'}
          progress={metrics.memoryUsage}
          animated={realTimeEnabled}
        />
      ),
    },
    {
      id: 'system-status',
      title: 'System Status',
      defaultLayout: { x: 0, y: 4, w: 6, h: 6 },
      children: (
        <StatusCard
          title="System Components"
          items={[
            {
              id: 'jetstream',
              label: 'JetStream Core',
              value: 'Online',
              status: 'healthy',
              description: 'Message persistence and streaming',
              progress: 98,
            },
            {
              id: 'connectors',
              label: 'Tool Connectors',
              value: `${metrics.activeConnections} Active`,
              status: 'healthy',
              description: 'External system integrations',
              progress: 95,
            },
          ]}
        />
      ),
    },
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      defaultLayout: { x: 6, y: 4, w: 6, h: 6 },
      children: (
        <ActivityCard
          title="Recent Events"
          activities={[
            {
              id: '1',
              title: 'Message processed',
              description: 'Message processed successfully',
              timestamp: '09:14:32',
              type: 'success',
            },
            {
              id: '2',
              title: 'Connection established',
              description: 'New connection established',
              timestamp: '09:14:28',
              type: 'success',
            },
            {
              id: '3',
              title: 'Error occurred',
              description: 'Error occurred while processing message',
              timestamp: '09:14:25',
              type: 'error',
            },
          ]}
          maxItems={8}
          showTimestamps={true}
        />
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Enhanced Header */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? `
              linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%),
              radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.12) 0%, transparent 60%)
            `
            : `
              linear-gradient(135deg, #ffffff 0%, #f8fafc 100%),
              radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)
            `,
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(251, 191, 36, 0.15)'
            : '1px solid rgba(245, 158, 11, 0.1)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(251, 191, 36, 0.15)'
            : '0 8px 32px rgba(245, 158, 11, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}
            >
              Tool Bus Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              NATS JetStream Monitoring & Analytics • Health: {systemHealth}%
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#fbbf24',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#f59e0b',
                  },
                }}
              />
            }
            label="Real-time Updates"
            sx={{
              '& .MuiFormControlLabel-label': {
                fontWeight: 500,
                color: theme.palette.text.secondary,
              },
            }}
          />
        </Box>
      </Box>

      {/* Dashboard Grid with Draggable/Resizable Cards */}
      <DashboardGrid
        cards={dashboardCards}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={(_, layouts) => {
          // Save layout preferences to localStorage or backend
          console.log('Layout changed:', layouts);
        }}
      />
    </Box>
  );
};

export default ToolBusDashboard;
