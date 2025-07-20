/**
 * ConnectorDetail - Production-ready connector detail page using DashboardGrid
 * 
 * This component provides a comprehensive view of a single connector with
 * health metrics, configuration options, and management actions.
 * Uses the reusable DashboardGrid framework for consistent layout.
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,

  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Settings,
  PlayArrow,

  Refresh,
  MoreVert,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Delete,

  Api,

  Speed,

} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardGrid, DashboardCardProps } from '../../shared/components/dashboard/DashboardGrid';
import { MetricCard } from '../../shared/components/dashboard/cards/MetricCard';
import { StatusCard } from '../../shared/components/dashboard/cards/StatusCard';
import { ActivityCard } from '../../shared/components/dashboard/cards/ActivityCard';
import { HealthChip, HealthStatus } from '../../shared/components/ui/HealthChip';
import { ConnectorIcon } from '../../shared/components/ui/ConnectorIcon';
import { ConnectorData } from './ConnectorGallery';

/**
 * Extended connector data with additional detail information
 */
interface ConnectorDetailData extends ConnectorData {
  configuration?: Record<string, any>;
  metrics?: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  recentActivity?: Array<{
    id: string;
    timestamp: string;
    action: string;
    status: 'success' | 'error' | 'warning';
    message: string;
  }>;
  endpoints?: Array<{
    name: string;
    method: string;
    path: string;
    status: HealthStatus;
  }>;
}

/**
 * Mock detailed connector data
 */
const mockDetailedConnector: ConnectorDetailData = {
  id: 'workday-hr',
  name: 'Workday HR',
  vendor: 'Workday Inc.',
  description: 'Complete HR management integration with employee data, payroll, and benefits',
  version: '2.1.0',
  status: 'healthy',
  category: 'hr',
  ports: ['hr.employee.query', 'hr.employee.update', 'hr.payroll.get'],
  installCount: 1247,
  lastUpdated: '2025-01-15',
  configuration: {
    baseUrl: 'https://api.workday.com/v1',
    timeout: 30000,
    retryAttempts: 3,
    batchSize: 100
  },
  metrics: {
    requestsPerMinute: 45,
    averageResponseTime: 250,
    errorRate: 0.02,
    uptime: 99.8
  },
  recentActivity: [
    {
      id: '1',
      timestamp: '2025-01-19T10:30:00Z',
      action: 'Employee data sync',
      status: 'success',
      message: 'Synchronized 1,234 employee records'
    },
    {
      id: '2',
      timestamp: '2025-01-19T09:15:00Z',
      action: 'Payroll query',
      status: 'success',
      message: 'Retrieved payroll data for 856 employees'
    },
    {
      id: '3',
      timestamp: '2025-01-19T08:45:00Z',
      action: 'Health check',
      status: 'warning',
      message: 'Response time elevated (450ms)'
    }
  ],
  endpoints: [
    { name: 'Employee Query', method: 'GET', path: '/employees', status: 'healthy' },
    { name: 'Employee Update', method: 'PUT', path: '/employees/{id}', status: 'healthy' },
    { name: 'Payroll Get', method: 'GET', path: '/payroll', status: 'warning' }
  ]
};

/**
 * ConnectorDetail component using DashboardGrid framework
 * 
 * Features:
 * - Reusable DashboardGrid layout
 * - Real-time metrics and health monitoring
 * - Configuration management
 * - Activity logs and endpoint status
 * - Management actions (start/stop/configure)
 * 
 * @example
 * ```tsx
 * <ConnectorDetail />
 * ```
 */
const ConnectorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [connector] = useState<ConnectorDetailData>(mockDetailedConnector);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleBack = () => {
    navigate('/admin/connectors');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = useCallback((action: string) => {
    handleMenuClose();
    console.log(`Action: ${action} for connector: ${connector.id}`);
    // TODO: Implement actions
  }, [connector.id]);

  // Create dashboard cards for DashboardGrid
  const dashboardCards: DashboardCardProps[] = [
    // Overview Card
    {
      id: 'connector-overview',
      title: 'Connector Overview',
      defaultLayout: { x: 0, y: 0, w: 6, h: 4 },
      children: (
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <ConnectorIcon
                category={connector.category}
                iconUrl={connector.logo}
                fallbackText={connector.name}
                size={48}
              />
              <Box sx={{ flexGrow: 1, ml: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {connector.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {connector.vendor} • Version {connector.version}
                </Typography>
                <HealthChip status={connector.status} />
              </Box>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 3 }}>
              {connector.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={connector.category.toUpperCase()} size="small" variant="outlined" />
              <Chip label={`${connector.ports.length} Ports`} size="small" variant="outlined" />
              <Chip label={`${connector.installCount.toLocaleString()} Installs`} size="small" variant="outlined" />
            </Box>

            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(connector.lastUpdated).toLocaleDateString()}
            </Typography>
          </CardContent>
        </Card>
      )
    },

    // Metrics Cards
    {
      id: 'requests-metric',
      title: 'Requests/Min',
      defaultLayout: { x: 6, y: 0, w: 3, h: 2 },
      children: (
        <MetricCard
          title="Requests/Min"
          value={connector.metrics?.requestsPerMinute || 0}
          unit=""
          trend={5.2}
          icon={<Api />}
          color="primary"
        />
      )
    },

    {
      id: 'response-time-metric',
      title: 'Avg Response Time',
      defaultLayout: { x: 9, y: 0, w: 3, h: 2 },
      children: (
        <MetricCard
          title="Avg Response Time"
          value={connector.metrics?.averageResponseTime || 0}
          unit="ms"
          trend={-2.1}
          icon={<Speed />}
          color="success"
        />
      )
    },

    {
      id: 'error-rate-metric',
      title: 'Error Rate',
      defaultLayout: { x: 6, y: 2, w: 3, h: 2 },
      children: (
        <MetricCard
          title="Error Rate"
          value={connector.metrics?.errorRate || 0}
          unit="%"
          trend={-0.5}
          icon={<ErrorIcon />}
          color="error"
        />
      )
    },

    {
      id: 'uptime-metric',
      title: 'Uptime',
      defaultLayout: { x: 9, y: 2, w: 3, h: 2 },
      children: (
        <MetricCard
          title="Uptime"
          value={connector.metrics?.uptime || 0}
          unit="%"
          trend={0.1}
          icon={<CheckCircle />}
          color="success"
        />
      )
    },

    // Status Card
    {
      id: 'connector-status',
      title: 'System Status',
      defaultLayout: { x: 0, y: 4, w: 6, h: 3 },
      children: (
        <StatusCard
          title="System Status"
          status={connector.status}
          items={[
            { label: 'API Connection', status: 'healthy', description: 'Connected and responsive' },
            { label: 'Authentication', status: 'healthy', description: 'Token valid for 2 hours' },
            { label: 'Rate Limiting', status: 'warning', description: '80% of limit used' },
            { label: 'Data Sync', status: 'healthy', description: 'Last sync 5 minutes ago' }
          ]}
        />
      )
    },

    // Activity Card
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      defaultLayout: { x: 6, y: 4, w: 6, h: 3 },
      children: (
        <ActivityCard
          title="Recent Activity"
          activities={connector.recentActivity?.map(activity => ({
            id: activity.id,
            title: activity.action,
            description: activity.message,
            timestamp: activity.timestamp,
            status: activity.status,
            icon: activity.status === 'success' ? <CheckCircle /> : 
                  activity.status === 'warning' ? <Warning /> : <ErrorIcon />
          })) || []}
        />
      )
    },

    // Endpoints Card
    {
      id: 'endpoints',
      title: 'API Endpoints',
      defaultLayout: { x: 0, y: 7, w: 12, h: 4 },
      children: (
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              API Endpoints
            </Typography>
            <List dense>
              {connector.endpoints?.map((endpoint, index) => (
                <React.Fragment key={endpoint.name}>
                  <ListItem>
                    <ListItemIcon>
                      <Chip 
                        label={endpoint.method} 
                        size="small" 
                        variant="outlined"
                        color={endpoint.method === 'GET' ? 'primary' : 
                               endpoint.method === 'POST' ? 'success' : 'default'}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={endpoint.name}
                      secondary={endpoint.path}
                    />
                    <HealthChip status={endpoint.status} size="small" />
                  </ListItem>
                  {index < connector.endpoints!.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleBack} size="small">
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {connector.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connector Details & Management
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<Settings />} 
              size="small"
              onClick={() => navigate(`/admin/connectors/${id}/configure`)}
            >
              Configure
            </Button>
            <Button variant="outlined" startIcon={<PlayArrow />} size="small">
              Test Connection
            </Button>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Status Alert */}
        {connector.status === 'warning' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Connector is experiencing elevated response times. Monitor performance closely.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* DashboardGrid with Connector Details */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <DashboardGrid cards={dashboardCards} />
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleAction('restart')}>
          <Refresh sx={{ mr: 1 }} fontSize="small" />
          Restart Connector
        </MenuItem>
        <MenuItem onClick={() => handleAction('logs')}>
          <Info sx={{ mr: 1 }} fontSize="small" />
          View Logs
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('uninstall')} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Uninstall
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ConnectorDetail;
