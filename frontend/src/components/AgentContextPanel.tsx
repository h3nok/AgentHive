import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Collapse,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  SmartToy,
  Memory,
  Psychology,
  Code,
  Language,
  Search,
  Build,
  Cloud,
  Speed,
  ExpandMore,
  ExpandLess,
  Settings,
  Info,
  Storage,
  Api,
  Web,
  Email,
  Assessment,
  FiberManualRecord
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  status: 'ready' | 'thinking' | 'processing' | 'offline' | 'error';
  memoryContext: number; // 0-100 percentage
  avatar?: string;
  description?: string;
  capabilities: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
    status: 'active' | 'idle' | 'error';
    description?: string;
  }>;
  tools: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
    status: 'connected' | 'disconnected' | 'error';
    lastUsed?: string;
  }>;
  metrics?: {
    totalQueries: number;
    successRate: number;
    avgResponseTime: number;
    tokensUsed: number;
  };
}

interface AgentContextPanelProps {
  agent: Agent;
  onCapabilityClick?: (capabilityId: string) => void;
  onToolClick?: (toolId: string) => void;
  onConfigureAgent?: (agentId: string) => void;
  onViewMetrics?: (agentId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const AgentContextPanel: React.FC<AgentContextPanelProps> = ({
  agent,
  onCapabilityClick,
  onToolClick,
  onConfigureAgent,
  onViewMetrics,
  isExpanded = true,
  onToggleExpand
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedSections, setExpandedSections] = useState({
    capabilities: true,
    tools: false,
    metrics: false
  });

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': case 'active': case 'connected': return theme.palette.success.main;
      case 'thinking': case 'processing': return theme.palette.warning.main;
      case 'offline': case 'disconnected': return theme.palette.text.disabled;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'thinking': case 'processing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <FiberManualRecord sx={{ fontSize: 8, color: getStatusColor(status) }} />
          </motion.div>
        );
      default:
        return <FiberManualRecord sx={{ fontSize: 8, color: getStatusColor(status) }} />;
    }
  };

  return (
    <Paper 
      elevation={1}
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      {/* Agent Header */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={agent.avatar}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              width: 40,
              height: 40
            }}
          >
            <SmartToy />
          </Avatar>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {agent.name}
              </Typography>
              {getStatusIcon(agent.status)}
            </Stack>
            
            <Typography variant="body2" color="text.secondary" noWrap>
              {agent.description || `Status: ${agent.status}`}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            <Settings fontSize="small" />
          </IconButton>
        </Stack>

        {/* Memory Context */}
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Memory Context
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {agent.memoryContext}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={agent.memoryContext}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: agent.memoryContext > 80 ? theme.palette.warning.main : theme.palette.primary.main
              }
            }}
          />
        </Box>
      </Box>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Capabilities Section */}
            <Box sx={{ p: 1 }}>
              <ListItemButton
                onClick={() => toggleSection('capabilities')}
                sx={{ borderRadius: 1, py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Psychology fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Capabilities"
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                {expandedSections.capabilities ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={expandedSections.capabilities}>
                <Box sx={{ pl: 1, pr: 1, pb: 1 }}>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {agent.capabilities.map((capability) => (
                      <Chip
                        key={capability.id}
                        label={capability.name}
                        size="small"
                        clickable
                        onClick={() => onCapabilityClick?.(capability.id)}
                        icon={capability.icon as React.ReactElement}
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          bgcolor: alpha(getStatusColor(capability.status), 0.1),
                          color: getStatusColor(capability.status),
                          border: `1px solid ${alpha(getStatusColor(capability.status), 0.2)}`,
                          '&:hover': {
                            bgcolor: alpha(getStatusColor(capability.status), 0.2)
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Collapse>
            </Box>

            {/* Tools Section */}
            <Box sx={{ p: 1 }}>
              <ListItemButton
                onClick={() => toggleSection('tools')}
                sx={{ borderRadius: 1, py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Build fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Connected Tools"
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                {expandedSections.tools ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={expandedSections.tools}>
                <List dense sx={{ pl: 1 }}>
                  {agent.tools.map((tool) => (
                    <ListItem
                      key={tool.id}
                      sx={{ 
                        py: 0.25, 
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) }
                      }}
                      onClick={() => onToolClick?.(tool.id)}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {tool.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={tool.name}
                        secondary={tool.lastUsed ? `Last used: ${tool.lastUsed}` : 'Never used'}
                        primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }}
                        secondaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem' }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getStatusIcon(tool.status)}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>

            {/* Metrics Section */}
            {agent.metrics && (
              <Box sx={{ p: 1 }}>
                <ListItemButton
                  onClick={() => toggleSection('metrics')}
                  sx={{ borderRadius: 1, py: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Assessment fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Performance"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  />
                  {expandedSections.metrics ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                
                <Collapse in={expandedSections.metrics}>
                  <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">Queries</Typography>
                        <Typography variant="caption" fontWeight={500}>
                          {agent.metrics.totalQueries.toLocaleString()}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">Success Rate</Typography>
                        <Typography variant="caption" fontWeight={500}>
                          {agent.metrics.successRate}%
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption">Avg Response</Typography>
                        <Typography variant="caption" fontWeight={500}>
                          {agent.metrics.avgResponseTime}ms
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Collapse>
              </Box>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{ '& .MuiPaper-root': { minWidth: 160 } }}
      >
        <MenuItem onClick={() => { onConfigureAgent?.(agent.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Configure Agent
        </MenuItem>
        <MenuItem onClick={() => { onViewMetrics?.(agent.id); handleMenuClose(); }}>
          <ListItemIcon>
            <Assessment fontSize="small" />
          </ListItemIcon>
          View Metrics
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          Agent Info
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default AgentContextPanel;
