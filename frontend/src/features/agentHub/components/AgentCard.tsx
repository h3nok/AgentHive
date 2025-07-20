import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  LinearProgress,
  Chip,
  Box,
  Typography,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Hub as HubIcon,
  Psychology as PsychologyIcon,
  SmartToy as SmartToyIcon,
  AutoGraph as AutoGraphIcon,
} from '@mui/icons-material';

export interface Agent {
  id: string;
  name: string;
  type: 'orchestrator' | 'specialist' | 'assistant' | 'analyst';
  status: 'online' | 'offline' | 'busy' | 'error';
  capabilities: string[];
  cpu: number;
  memory: number;
  tasksCompleted: number;
  successRate: number;
  responseTime: number;
}

interface AgentCardProps {
  agent: Agent;
  onMore?: (agent: Agent) => void;
}

const getAgentStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'success.main';
    case 'busy':
      return 'warning.main';
    case 'error':
      return 'error.main';
    case 'offline':
      return 'text.disabled';
    default:
      return 'text.secondary';
  }
};

const getAgentTypeIcon = (type: string) => {
  switch (type) {
    case 'orchestrator':
      return <HubIcon />;
    case 'specialist':
      return <PsychologyIcon />;
    case 'assistant':
      return <SmartToyIcon />;
    case 'analyst':
      return <AutoGraphIcon />;
    default:
      return <SmartToyIcon />;
  }
};

const AgentCard: React.FC<AgentCardProps> = ({ agent, onMore }) => {
  const statusColor = getAgentStatusColor(agent.status);
  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: statusColor, color: '#fff' }}>
            {getAgentTypeIcon(agent.type)}
          </Avatar>
        }
        action={
          <IconButton aria-label="settings" onClick={() => onMore?.(agent)}>
            <MoreVertIcon />
          </IconButton>
        }
        title={
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {agent.name}
          </Typography>
        }
        subheader={
          <Typography variant="caption" color="textSecondary">
            {agent.type}
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0, pb: '8px !important' }}>
        {/* CPU / Memory */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="textSecondary">
              CPU: {agent.cpu}%
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Memory: {agent.memory}%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={agent.cpu}
              color={agent.cpu > 80 ? 'error' : agent.cpu > 60 ? 'warning' : 'primary'}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
            />
            <LinearProgress
              variant="determinate"
              value={agent.memory}
              color={agent.memory > 80 ? 'error' : agent.memory > 60 ? 'warning' : 'secondary'}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
            />
          </Box>
        </Box>

        {/* Capabilities */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
            CAPABILITIES
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {agent.capabilities.slice(0, 3).map((capability, index) => (
              <Chip
                key={index}
                label={capability.replace(/_/g, ' ')}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            ))}
            {agent.capabilities.length > 3 && (
              <Chip
                label={`+${agent.capabilities.length - 3}`}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}
          </Box>
        </Box>

        {/* Metrics */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="textSecondary" display="block">
              Tasks
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {agent.tasksCompleted.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary" display="block">
              Success
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="success.main">
              {agent.successRate}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="textSecondary" display="block">
              Response
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="primary">
              {agent.responseTime}s
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AgentCard;
