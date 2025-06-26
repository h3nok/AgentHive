import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Chip,
  Menu,
  MenuItem,
  Typography,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Tooltip,
  alpha,
  useTheme,
  Portal,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  SmartToy,
  Code,
  Business,
  Support,
  Engineering,
  Psychology,
} from '@mui/icons-material';

interface AgentStatus {
  id: string;
  name: string;
  status: 'ready' | 'thinking' | 'processing' | 'offline' | 'busy' | 'error';
  confidence: number;
  currentTask?: string;
  lastActivity?: string;
  responseTime?: number;
  expertise?: string[];
}

interface AgentSelectorProps {
  selectedAgent?: string;
  onAgentChange?: (agentId: string) => void;
  agentStatuses?: AgentStatus[];
  compact?: boolean;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentChange,
  agentStatuses = [],
  compact = false,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentAgent = useMemo(() => 
    agentStatuses.find(agent => agent.id === selectedAgent) || agentStatuses[0],
    [agentStatuses, selectedAgent]
  );

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleAgentSelect = useCallback((agentId: string) => {
    onAgentChange?.(agentId);
    handleClose();
  }, [onAgentChange, handleClose]);

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'technical': return Code;
      case 'business': return Business;
      case 'support': return Support;
      case 'engineering': return Engineering;
      case 'creative': return Psychology;
      default: return SmartToy;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10b981';
      case 'thinking': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'busy': return '#8b5cf6';
      case 'error': return '#ef4444';
      case 'offline': return '#6b7280';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'thinking': return 'Thinking...';
      case 'processing': return 'Processing';
      case 'busy': return 'Busy';
      case 'error': return 'Error';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  if (!currentAgent) {
    return null;
  }

  const AgentIcon = getAgentIcon(currentAgent.id);

  return (
    <>
      <Tooltip title="Select Agent">
        <Chip
          icon={
            <Badge
              badgeContent=""
              color="default"
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: getStatusColor(currentAgent.status),
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                  border: `1px solid ${theme.palette.background.paper}`,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                },
              }}
            >
              <AgentIcon sx={{ fontSize: '1.1rem !important' }} />
            </Badge>
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>{compact ? currentAgent.name.split(' ')[0] : currentAgent.name}</span>
              <ExpandMoreIcon 
                sx={{ 
                  fontSize: '1rem', 
                  opacity: 0.7,
                  transition: 'transform 0.2s ease',
                  transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                }} 
              />
            </Box>
          }
          onClick={handleClick}
          size="small"
          variant="outlined"
          sx={{
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#000', 0.3)
              : alpha('#fff', 0.6),
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderColor: alpha(getStatusColor(currentAgent.status), 0.3),
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha('#fff', 0.05)
                : alpha('#000', 0.05),
              borderColor: alpha(getStatusColor(currentAgent.status), 0.5),
              transform: 'translateY(-1px)',
              boxShadow: `0 2px 8px ${alpha(getStatusColor(currentAgent.status), 0.2)}`,
            },
            '&:focus-visible': {
              outline: `2px solid ${getStatusColor(currentAgent.status)}`,
              outlineOffset: 2,
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            fontWeight: 500,
            pr: 0.5,
          }}
        />
      </Tooltip>
      
      {/* Portal the menu to body to avoid z-index issues */}
      <Portal>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          TransitionProps={{
            style: { transformOrigin: 'top center' }
          }}
          PaperProps={{
            elevation: 8,
            sx: {
              minWidth: 320,
              maxHeight: 400,
              mt: 1.5,
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha('#1a1a1a', 0.95)
                : alpha('#fff', 0.95),
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              borderRadius: 2,
              overflow: 'hidden',
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                transition: 'all 0.2s ease',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Available Agents ({agentStatuses.length})
            </Typography>
          </Box>
          
          <Box sx={{ py: 0.5 }}>
            {agentStatuses.map((agent) => {
              const AgentIcon = getAgentIcon(agent.id);
              const isAvailable = agent.status !== 'offline' && agent.status !== 'error';
              
              return (
                <MenuItem
                  key={agent.id}
                  onClick={() => isAvailable && handleAgentSelect(agent.id)}
                  selected={agent.id === currentAgent.id}
                  disabled={!isAvailable}
                  sx={{ 
                    minHeight: 64,
                    opacity: isAvailable ? 1 : 0.5,
                    '&:hover': {
                      backgroundColor: isAvailable ? alpha(getStatusColor(agent.status), 0.05) : 'transparent',
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha(getStatusColor(agent.status), 0.08),
                      '&:hover': {
                        backgroundColor: alpha(getStatusColor(agent.status), 0.12),
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <Badge
                      badgeContent=""
                      color="default"
                      variant="dot"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: getStatusColor(agent.status),
                          boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                        }
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: alpha(getStatusColor(agent.status), 0.1),
                          color: getStatusColor(agent.status),
                        }}
                      >
                        <AgentIcon fontSize="small" />
                      </Avatar>
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {agent.name}
                        </Typography>
                        <Chip 
                          label={getStatusLabel(agent.status)} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            backgroundColor: alpha(getStatusColor(agent.status), 0.15),
                            color: getStatusColor(agent.status),
                            fontWeight: 700,
                            border: 'none',
                          }} 
                        />
                        {agent.confidence && (
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(agent.confidence * 100)}%
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {agent.currentTask && (
                          <>
                            <strong>Task:</strong> {agent.currentTask}
                            <br />
                          </>
                        )}
                        {agent.lastActivity && (
                          <>
                            <strong>Last active:</strong> {agent.lastActivity}
                          </>
                        )}
                        {agent.responseTime && (
                          <>
                            {' • '}
                            <strong>Response:</strong> {agent.responseTime}ms
                          </>
                        )}
                      </Typography>
                    }
                  />
                </MenuItem>
              );
            })}
          </Box>
        </Menu>
      </Portal>
    </>
  );
};

export default AgentSelector;
