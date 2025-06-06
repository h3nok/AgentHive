import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Hub as HubIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useGetRouterMetricsQuery, useLazyExportLearningDataQuery } from '../../../features/router/routerAnalyticsApi';
import RouterPerformanceChart from './RouterPerformanceChart';
import LearningMetricsChart from './LearningMetricsChart';
import AgentDistributionChart from './AgentDistributionChart';
import ContextAwarenessChart from './ContextAwarenessChart';
import FeedbackCollector from './FeedbackCollector';

type TimeRange = '1h' | '24h' | '7d' | '30d';
type ExportFormat = 'json' | 'csv';

const RouterAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useGetRouterMetricsQuery();

  const [exportData, { isLoading: isExporting }] = useLazyExportLearningDataQuery();

  const handleExport = async () => {
    try {
      const result = await exportData({ 
        format: exportFormat
      }).unwrap();
      
      // Create download link
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: exportFormat === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `router-analytics-${timeRange}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load router analytics: {error.toString()}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Router Analytics Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Export</InputLabel>
            <Select
              value={exportFormat}
              label="Export"
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SpeedIcon color="primary" />
                <Box>
                  <Typography variant="h4" component="div">
                    {metrics?.total_requests?.toLocaleString() || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon color="success" />
                <Box>
                  <Typography variant="h4" component="div">
                    {metrics?.context_metrics?.avg_user_satisfaction 
                      ? `${(metrics.context_metrics.avg_user_satisfaction * 100).toFixed(1)}%` 
                      : 'N/A'}
                  </Typography>
                  <Typography color="text.secondary">
                    Avg Satisfaction
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PsychologyIcon color="info" />
                <Box>
                  <Typography variant="h4" component="div">
                    {metrics?.learning_metrics?.success_rate 
                      ? `${(metrics.learning_metrics.success_rate * 100).toFixed(1)}%` 
                      : 'N/A'}
                  </Typography>
                  <Typography color="text.secondary">
                    Learning Success Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HubIcon color="warning" />
                <Box>
                  <Typography variant="h4" component="div">
                    {metrics?.context_metrics?.active_sessions || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Active Sessions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Placeholder */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Router Performance
              </Typography>
              <RouterPerformanceChart data={metrics} timeRange={timeRange} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Learning Metrics
              </Typography>
              <LearningMetricsChart data={metrics} timeRange={timeRange} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Distribution
              </Typography>
              <AgentDistributionChart data={metrics} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Context Awareness
              </Typography>
              <ContextAwarenessChart data={metrics} timeRange={timeRange} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Router Analytics Summary
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Router Type: {metrics?.router_type || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Version: {metrics?.version || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uptime: {metrics?.uptime || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enhanced Routing: {metrics?.enhanced_routing ? 'Enabled' : 'Disabled'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Learning Enabled: {metrics?.learning_metrics?.learning_enabled ? 'Yes' : 'No'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <FeedbackCollector />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RouterAnalyticsDashboard;
