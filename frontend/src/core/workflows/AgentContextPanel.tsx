import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Chip, 
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import { 
  SmartToy, 
  Psychology, 
  AutoAwesome, 
  Speed, 
  Security, 
  Group, 
  AccountBalance,
  Engineering,
  MoreVert,
  CheckCircle,
  Error,
  Warning,
  Info,
  Circle,
  Settings
} from '@mui/icons-material';

interface Capability {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'idle' | 'error';
  description?: string;
}

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  lastUsed?: string;
  description?: string;
}

interface AgentContextPanelProps {
  agent: {
    id: string;
    name: string;
    status: 'ready' | 'thinking' | 'processing' | 'offline' | 'error';
    memoryContext: number;
    capabilities: Capability[];
    tools: Tool[];
    metrics?: {
      totalQueries: number;
      successRate: number;
      avgResponseTime: number;
      tokensUsed: number;
    };
  };
  onConfigureAgent?: () => void;
  onManageTools?: () => void;
  onViewMetrics?: () => void;
}

const AgentContextPanel: React.FC<AgentContextPanelProps> = ({
  agent,
  onConfigureAgent,
  onManageTools,
  onViewMetrics
}) => {
  const theme = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle color="success" fontSize="small" />;
      case 'error':
        return <Error color="error" fontSize="small" />;
      case 'thinking':
      case 'processing':
        return <CircularProgress size={16} color="info" />;
      case 'offline':
        return <Circle color="disabled" fontSize="small" />;
      default:
        return <Info color="info" fontSize="small" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success.main';
      case 'thinking': 
      case 'processing': return 'info.main';
      case 'error': return 'error.main';
      case 'offline': return 'text.disabled';
      default: return 'text.secondary';
    }
  };

  const getToolStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success.main';
      case 'disconnected': return 'warning.main';
      case 'error': return 'error.main';
      default: return 'text.secondary';
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}
    >
      {/* Header */}
      <Box 
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.background.default
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <SmartToy />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {agent.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(agent.status)}
              <Typography variant="caption" color={getStatusColor(agent.status)}>
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton size="small" onClick={onConfigureAgent}>
          <Settings fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {/* Memory Usage */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="overline" color="textSecondary">
              Memory Context
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {agent.memoryContext}% used
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={agent.memoryContext} 
            color={agent.memoryContext > 80 ? 'error' : agent.memoryContext > 60 ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Capabilities */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Capabilities
          </Typography>
          <List dense disablePadding>
            {agent.capabilities.map((capability) => (
              <ListItem key={capability.id} disableGutters disablePadding sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box sx={{ color: getStatusColor(capability.status) }}>
                    {capability.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {capability.name}
                      </Typography>
                      <Box sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        bgcolor: getStatusColor(capability.status) 
                      }} />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      {capability.status.charAt(0).toUpperCase() + capability.status.slice(1)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tools */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">
              Connected Tools
            </Typography>
            <Typography 
              variant="caption" 
              color="primary" 
              onClick={onManageTools}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Manage
            </Typography>
          </Box>
          <List dense disablePadding>
            {agent.tools.map((tool) => (
              <Tooltip key={tool.id} title={tool.description || tool.name} arrow>
                <ListItem 
                  disableGutters 
                  disablePadding 
                  sx={{ 
                    py: 0.5, 
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box sx={{ color: getToolStatusColor(tool.status) }}>
                      {tool.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="body2">
                        {tool.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {tool.status === 'connected' 
                          ? tool.lastUsed ? `Last used ${tool.lastUsed}` : 'Connected'
                          : tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                      </Typography>
                    }
                  />
                </ListItem>
              </Tooltip>
            ))}
          </List>
        </Box>

        {/* Metrics */}
        {agent.metrics && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Performance Metrics
              </Typography>
              <Typography 
                variant="caption" 
                color="primary" 
                onClick={onViewMetrics}
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                View All
              </Typography>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
              <MetricCard 
                label="Total Queries"
                value={agent.metrics.totalQueries.toLocaleString()}
                icon={<Psychology fontSize="small" />}
                color={theme.palette.primary.main}
              />
              <MetricCard 
                label="Success Rate"
                value={`${agent.metrics.successRate}%`}
                icon={<CheckCircle fontSize="small" />}
                color={theme.palette.success.main}
              />
              <MetricCard 
                label="Avg. Response"
                value={`${agent.metrics.avgResponseTime}s`}
                icon={<Speed fontSize="small" />}
                color={theme.palette.info.main}
              />
              <MetricCard 
                label="Tokens Used"
                value={agent.metrics.tokensUsed.toLocaleString()}
                icon={<DataUsage fontSize="small" />}
                color={theme.palette.warning.main}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box 
        sx={{ 
          p: 1, 
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="caption" color="textSecondary">
          Agent ID: {agent.id}
        </Typography>
        <Chip 
          label="v1.0.0" 
          size="small" 
          variant="outlined"
          sx={{ height: 20, fontSize: '0.65rem' }}
        />
      </Box>
    </Paper>
  );
};

// Helper component for metrics
const MetricCard = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => (
  <Paper 
    elevation={0}
    sx={{
      p: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRadius: 2,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      '&:hover': {
        boxShadow: 1
      }
    }}
  >
    <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
    <Typography variant="h6" fontWeight="bold">
      {value}
    </Typography>
    <Typography variant="caption" color="textSecondary" align="center">
      {label}
    </Typography>
  </Paper>
);

export default AgentContextPanel;
