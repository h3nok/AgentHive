import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Typography,
  Avatar,
  Stack,
  LinearProgress,
  Tooltip,
  Badge,
  IconButton,
  Collapse,
  Paper,
  alpha
} from '@mui/material';
import {
  Psychology,
  Speed,
  TrendingUp,
  CheckCircle,
  RadioButtonChecked,
  PauseCircle,
  Error,
  ExpandMore,
  ExpandLess,
  Lightbulb,
  Memory,
  AutoMode
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface AgentStatus {
  id: string;
  name: string;
  status: 'thinking' | 'processing' | 'ready' | 'busy' | 'error';
  confidence: number;
  reasoning?: string;
  currentTask?: string;
  capabilities: string[];
  memoryContext: number; // 0-100 percentage
  responseTime: number; // in ms
  lastActivity: string;
}

interface AgentStatusIndicatorProps {
  agent: AgentStatus;
  isSelected?: boolean;
  showDetails?: boolean;
  onSelect?: (agentId: string) => void;
  realTimeUpdates?: boolean;
}

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({
  agent,
  isSelected = false,
  showDetails = false,
  onSelect,
  realTimeUpdates = true
}) => {
  const [expanded, setExpanded] = useState(false);
  const [thinkingAnimation, setThinkingAnimation] = useState(false);

  // Simulate real-time thinking animation
  useEffect(() => {
    if (agent.status === 'thinking' && realTimeUpdates) {
      setThinkingAnimation(true);
      const interval = setInterval(() => {
        setThinkingAnimation(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [agent.status, realTimeUpdates]);

  const getStatusConfig = () => {
    switch (agent.status) {
      case 'thinking':
        return {
          color: '#2196f3',
          bgColor: alpha('#2196f3', 0.1),
          icon: Psychology,
          label: 'Thinking...',
          description: 'Processing your request with advanced reasoning'
        };
      case 'processing':
        return {
          color: '#ff9800',
          bgColor: alpha('#ff9800', 0.1),
          icon: AutoMode,
          label: 'Processing',
          description: 'Analyzing data and generating response'
        };
      case 'ready':
        return {
          color: '#4caf50',
          bgColor: alpha('#4caf50', 0.1),
          icon: CheckCircle,
          label: 'Ready',
          description: 'Available and optimized for your queries'
        };
      case 'busy':
        return {
          color: '#ff5722',
          bgColor: alpha('#ff5722', 0.1),
          icon: RadioButtonChecked,
          label: 'Busy',
          description: 'Handling another task, please wait'
        };
      case 'error':
        return {
          color: '#f44336',
          bgColor: alpha('#f44336', 0.1),
          icon: Error,
          label: 'Error',
          description: 'Encountered an issue, trying to recover'
        };
      default:
        return {
          color: '#9e9e9e',
          bgColor: alpha('#9e9e9e', 0.1),
          icon: PauseCircle,
          label: 'Unknown',
          description: 'Status unclear'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#4caf50';
    if (confidence >= 70) return '#ff9800';
    return '#f44336';
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={isSelected ? 4 : 1}
        sx={{
          p: 2,
          borderRadius: 2,
          cursor: onSelect ? 'pointer' : 'default',
          border: isSelected ? `2px solid ${statusConfig.color}` : '1px solid transparent',
          backgroundColor: isSelected ? statusConfig.bgColor : 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': onSelect ? {
            transform: 'translateY(-1px)',
            boxShadow: 4,
            backgroundColor: alpha(statusConfig.color, 0.05)
          } : {}
        }}
        onClick={() => onSelect?.(agent.id)}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={showDetails ? 2 : 0}>
          <Badge
            badgeContent={
              agent.status === 'thinking' ? (
                <motion.div
                  animate={{ scale: thinkingAnimation ? 1.2 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Lightbulb sx={{ fontSize: 12, color: '#ffc107' }} />
                </motion.div>
              ) : null
            }
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Avatar
              sx={{
                bgcolor: statusConfig.color,
                width: 40,
                height: 40,
                animation: agent.status === 'thinking' ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: `0 0 0 0 ${alpha(statusConfig.color, 0.7)}` },
                  '70%': { boxShadow: `0 0 0 10px ${alpha(statusConfig.color, 0)}` },
                  '100%': { boxShadow: `0 0 0 0 ${alpha(statusConfig.color, 0)}` }
                }
              }}
            >
              <StatusIcon fontSize="small" />
            </Avatar>
          </Badge>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {agent.name}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label={statusConfig.label}
                size="small"
                sx={{
                  bgcolor: statusConfig.bgColor,
                  color: statusConfig.color,
                  fontWeight: 500,
                  fontSize: '0.7rem'
                }}
              />
              {agent.currentTask && (
                <Typography variant="caption" color="text.secondary">
                  {agent.currentTask}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Confidence Score */}
          <Tooltip title={`Confidence: ${agent.confidence}%`}>
            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
              <Typography
                variant="h6"
                sx={{
                  color: getConfidenceColor(agent.confidence),
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                {agent.confidence}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={agent.confidence}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: alpha(getConfidenceColor(agent.confidence), 0.2),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getConfidenceColor(agent.confidence),
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </Tooltip>

          {showDetails && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Stack>

        {/* Reasoning Display */}
        {agent.reasoning && (
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontStyle: 'italic',
                backgroundColor: alpha(statusConfig.color, 0.05),
                p: 1,
                borderRadius: 1,
                border: `1px solid ${alpha(statusConfig.color, 0.1)}`
              }}
            >
              💭 {agent.reasoning}
            </Typography>
          </Box>
        )}

        {/* Expanded Details */}
        <Collapse in={expanded && showDetails}>
          <Stack spacing={2} mt={2}>
            {/* Performance Metrics */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Performance Metrics
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Tooltip title="Response Time">
                  <Chip
                    icon={<Speed />}
                    label={formatResponseTime(agent.responseTime)}
                    size="small"
                    variant="outlined"
                    color={agent.responseTime < 500 ? 'success' : agent.responseTime < 1000 ? 'warning' : 'error'}
                  />
                </Tooltip>
                <Tooltip title="Memory Context">
                  <Chip
                    icon={<Memory />}
                    label={`${agent.memoryContext}% context`}
                    size="small"
                    variant="outlined"
                    color={agent.memoryContext > 70 ? 'success' : 'warning'}
                  />
                </Tooltip>
              </Stack>
            </Box>

            {/* Capabilities */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Current Capabilities
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {agent.capabilities.slice(0, 4).map((capability, index) => (
                  <Chip
                    key={index}
                    label={capability}
                    size="small"
                    sx={{
                      fontSize: '0.6rem',
                      height: 20,
                      bgcolor: alpha(statusConfig.color, 0.1),
                      color: statusConfig.color
                    }}
                  />
                ))}
                {agent.capabilities.length > 4 && (
                  <Chip
                    label={`+${agent.capabilities.length - 4} more`}
                    size="small"
                    sx={{ fontSize: '0.6rem', height: 20 }}
                  />
                )}
              </Stack>
            </Box>

            {/* Last Activity */}
            <Typography variant="caption" color="text.secondary">
              Last active: {agent.lastActivity}
            </Typography>
          </Stack>
        </Collapse>
      </Paper>
    </motion.div>
  );
};

export default AgentStatusIndicator;
