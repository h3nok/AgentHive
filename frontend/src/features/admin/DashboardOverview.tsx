import React from 'react';
import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Speed,
  SmartToy,
  People,
  Add,
  PersonAdd,
  Assessment,
  Refresh,
} from '@mui/icons-material';
import { DashboardGrid, DashboardCardProps } from '../../shared/components/dashboard/DashboardGrid';

// Activity item interface for type safety
interface ActivityItem {
  id: string;
  type: 'agent' | 'user' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const DashboardOverview: React.FC = () => {
  const theme = useTheme();

  // Mock data for metrics
  const metrics = {
    activeAgents: 24,
    totalUsers: 1247,
    successRate: 94.2,
    avgResponseTime: 1.8,
  };



  // Mock data for recent activities
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'agent',
      title: 'Agent deployed successfully',
      description: 'New customer service agent is now active',
      timestamp: '2 minutes ago',
      status: 'success',
    },
    {
      id: '2',
      type: 'user',
      title: 'New user registered',
      description: 'john.doe@company.com joined the platform',
      timestamp: '5 minutes ago',
      status: 'success',
    },
    {
      id: '3',
      type: 'system',
      title: 'System maintenance completed',
      description: 'Database optimization finished',
      timestamp: '1 hour ago',
      status: 'success',
    },
    {
      id: '4',
      type: 'system',
      title: 'Connection timeout',
      description: 'API Gateway agent lost connection',
      timestamp: '12 minutes ago',
      status: 'error',
    }
  ];

  const dashboardCards: DashboardCardProps[] = [
    // Active Agents Metric
    {
      id: 'active-agents',
      title: 'Active Agents',
      defaultLayout: { x: 0, y: 0, w: 3, h: 4 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SmartToy sx={{ color: theme.palette.primary.main, fontSize: '2rem' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {metrics.activeAgents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently online
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
              +8% from last hour
            </Typography>
          </Box>
        </Box>
      ),
    },
    // Total Users Metric
    {
      id: 'total-users',
      title: 'Total Users',
      defaultLayout: { x: 3, y: 0, w: 3, h: 4 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <People sx={{ color: theme.palette.secondary.main, fontSize: '2rem' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                {metrics.totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered users
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
              +12% this month
            </Typography>
          </Box>
        </Box>
      ),
    },
    // Success Rate Metric
    {
      id: 'success-rate',
      title: 'Success Rate',
      defaultLayout: { x: 6, y: 0, w: 3, h: 4 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: '2rem' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {metrics.successRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 24 hours
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
              +2% improvement
            </Typography>
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
                {metrics.avgResponseTime}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average response
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
              -5% faster
            </Typography>
          </Box>
        </Box>
      ),
    },
    // Recent Activity
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      defaultLayout: { x: 0, y: 4, w: 6, h: 6 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recent Activity
          </Typography>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {mockActivities.map((activity) => (
              <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ minWidth: 32 }}>
                  {activity.status === 'success' && <CheckCircle sx={{ color: 'success.main', fontSize: '1.2rem' }} />}
                  {activity.status === 'warning' && <Refresh sx={{ color: 'warning.main', fontSize: '1.2rem' }} />}
                  {activity.status === 'error' && <Refresh sx={{ color: 'error.main', fontSize: '1.2rem' }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {activity.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.description}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                    {activity.timestamp}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ),
    },
    // Quick Actions
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      defaultLayout: { x: 6, y: 4, w: 6, h: 6 },
      children: (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}>
              <Add sx={{ color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Deploy New Agent
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}>
              <PersonAdd sx={{ color: 'secondary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Invite User
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}>
              <Assessment sx={{ color: '#f59e0b' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Generate Report
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>

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
          console.log('Layout changed:', layouts);
        }}
      />
    </Box>
  );
};

export default DashboardOverview;
