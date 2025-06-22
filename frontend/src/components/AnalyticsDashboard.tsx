import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  LinearProgress,
  CircularProgress,
  Tooltip,
  Alert,
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
  Schedule,
  Error,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  Download,
  Settings,
  FilterList,
  DateRange,
  MoreVert
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

interface MetricData {
  timestamp: string;
  value: number;
  label?: string;
}

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalQueries: number;
  successRate: number;
  avgResponseTime: number;
  tokensUsed: number;
  errorRate: number;
  uptime: number;
  lastActivity: string;
  trend: 'up' | 'down' | 'stable';
  status: 'active' | 'idle' | 'error';
}

interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  totalQueries: number;
  avgResponseTime: number;
  successRate: number;
  tokensUsed: number;
  cost: number;
  uptime: number;
  errorRate: number;
}

interface AnalyticsDashboardProps {
  systemMetrics: SystemMetrics;
  agentMetrics: AgentMetrics[];
  performanceData: MetricData[];
  usageData: MetricData[];
  errorData: MetricData[];
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  onTimeRangeChange?: (range: '1h' | '6h' | '24h' | '7d' | '30d') => void;
  onRefresh?: () => void;
  onExport?: (type: 'pdf' | 'csv' | 'json') => void;
  isLoading?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  systemMetrics,
  agentMetrics,
  performanceData,
  usageData,
  errorData,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  onExport,
  isLoading = false
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'overview' | 'agents' | 'performance' | 'costs'>('overview');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'idle': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" fontSize="small" />;
      case 'down': return <TrendingDown color="error" fontSize="small" />;
      default: return <span style={{ width: 20, height: 20, display: 'inline-block' }} />;
    }
  };

  const filteredAgentMetrics = useMemo(() => {
    if (selectedAgent === 'all') return agentMetrics;
    return agentMetrics.filter(agent => agent.agentId === selectedAgent);
  }, [agentMetrics, selectedAgent]);

  const pieChartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* Header Controls */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>        
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Time Range Selector */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => onTimeRangeChange?.(e.target.value as any)}
            >
              <MenuItem value="1h">1 Hour</MenuItem>
              <MenuItem value="6h">6 Hours</MenuItem>
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
            </Select>
          </FormControl>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="overview">Overview</ToggleButton>
            <ToggleButton value="agents">Agents</ToggleButton>
            <ToggleButton value="performance">Performance</ToggleButton>
            <ToggleButton value="costs">Costs</ToggleButton>
          </ToggleButtonGroup>

          {/* Action Buttons */}
          <IconButton onClick={onRefresh} disabled={isLoading}>
            <Refresh fontSize="small" />
          </IconButton>
          
          <IconButton onClick={handleMenuOpen}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {isLoading && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <Stack spacing={3}>
          {/* System Overview Cards */}
          <Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, flexGrow: 1 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Psychology sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {systemMetrics.activeAgents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Agents
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      of {systemMetrics.totalAgents} total
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Assessment sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {formatValue(systemMetrics.successRate, 'percentage')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5}>
                      {getTrendIcon('up')}
                      <Typography variant="caption" color="success.main">
                        +2.1%
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Speed sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {formatValue(systemMetrics.avgResponseTime, 'time')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response
                    </Typography>
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5}>
                      {getTrendIcon('down')}
                      <Typography variant="caption" color="success.main">
                        -150ms
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Memory sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {formatValue(systemMetrics.tokensUsed / 1000000, 'number')}M
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tokens Used
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatValue(systemMetrics.cost, 'currency')} cost
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* System Status */}
              <Card sx={{ minWidth: 300 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    System Status
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">Uptime</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatValue(systemMetrics.uptime, 'percentage')}
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={systemMetrics.uptime} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">Error Rate</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatValue(systemMetrics.errorRate, 'percentage')}
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={systemMetrics.errorRate} 
                        color="error"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">Query Volume</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatValue(systemMetrics.totalQueries)} total
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            {/* Performance Chart */}
            <Card sx={{ flexGrow: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Response Time Trends
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value) => [formatValue(value as number, 'time'), 'Response Time']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={theme.palette.primary.main}
                        fill={alpha(theme.palette.primary.main, 0.2)}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Usage Distribution */}
            <Card sx={{ minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Agent Usage Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={agentMetrics.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="totalQueries"
                        nameKey="agentName"
                      >
                        {agentMetrics.slice(0, 6).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [formatValue(value as number), 'Queries']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      )}

      {/* Agents Mode */}
      {viewMode === 'agents' && (
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Agent Filter</InputLabel>
              <Select
                value={selectedAgent}
                label="Agent Filter"
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <MenuItem value="all">All Agents</MenuItem>
                {agentMetrics.map((agent) => (
                  <MenuItem key={agent.agentId} value={agent.agentId}>
                    {agent.agentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            {filteredAgentMetrics.map((agent) => (
              <motion.div
                key={agent.agentId}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {agent.agentName}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            size="small"
                            label={agent.status}
                            sx={{
                              bgcolor: alpha(getStatusColor(agent.status), 0.1),
                              color: getStatusColor(agent.status),
                              fontSize: '0.7rem'
                            }}
                          />
                          {getTrendIcon(agent.trend)}
                        </Stack>
                      </Box>
                      <CircularProgress
                        variant="determinate"
                        value={agent.successRate}
                        size={40}
                        thickness={4}
                        sx={{
                          color: agent.successRate > 90 ? 
                            theme.palette.success.main : 
                            agent.successRate > 70 ? 
                              theme.palette.warning.main : 
                              theme.palette.error.main
                        }}
                      />
                    </Stack>

                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Queries
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatValue(agent.totalQueries)}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Avg Response
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatValue(agent.avgResponseTime, 'time')}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Tokens Used
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatValue(agent.tokensUsed)}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Last Activity
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {agent.lastActivity}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>
        </Box>
      )}

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { onExport?.('pdf'); handleMenuClose(); }}>
          <Download fontSize="small" sx={{ mr: 1 }} />
          Export PDF
        </MenuItem>
        <MenuItem onClick={() => { onExport?.('csv'); handleMenuClose(); }}>
          <Download fontSize="small" sx={{ mr: 1 }} />
          Export CSV
        </MenuItem>
        <MenuItem onClick={() => { onExport?.('json'); handleMenuClose(); }}>
          <Download fontSize="small" sx={{ mr: 1 }} />
          Export JSON
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AnalyticsDashboard;
