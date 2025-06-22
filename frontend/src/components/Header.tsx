import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  alpha, 
  Button,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  SmartToy,
  Code,
  Business,
  Support,
  ExpandMore,
  Notifications,
  Settings
} from '@mui/icons-material';
import TractorIcon from './icons/TractorIcon';
import StatusBadge from './StatusBadge';

interface HeaderProps {
  className?: string;
  selectedAgent?: string;
  onAgentChange?: (agent: string) => void;
  agentStatuses?: Array<{
    id: string;
    name: string;
    status: 'ready' | 'thinking' | 'processing' | 'offline';
    confidence: number;
  }>;
}

const Header: React.FC<HeaderProps> = ({ 
  className = "",
  selectedAgent = 'general',
  onAgentChange,
  agentStatuses = [
    { id: 'general', name: 'General Assistant', status: 'ready', confidence: 95 },
    { id: 'technical', name: 'Technical Expert', status: 'thinking', confidence: 88 },
    { id: 'business', name: 'Business Analyst', status: 'ready', confidence: 92 },
    { id: 'support', name: 'Support Agent', status: 'processing', confidence: 85 }
  ]
}) => {
  const theme = useTheme();
  const [agentMenuAnchor, setAgentMenuAnchor] = useState<null | HTMLElement>(null);

  const currentAgent = agentStatuses.find(agent => agent.id === selectedAgent);
  
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'technical': return Code;
      case 'business': return Business;
      case 'support': return Support;
      default: return SmartToy;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10b981';
      case 'thinking': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Box
      className={`flex items-center justify-between ${className}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        px: 2,
        py: 1,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left side - Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        >
          <TractorIcon 
            className="h-5 w-5"
            sx={{ 
              fontSize: '1.25rem',
              color: '#c8102e',
            }} 
          />
          <Typography
            variant="h6"
            component="span"
            className="font-semibold"
            sx={{
              fontWeight: 600,
              color: '#c8102e',
              letterSpacing: '-0.02em',
            }}
          >
            AgentHive
          </Typography>
        </Box>

        {/* Live Status Pill */}
        <StatusBadge status="online" size="small" />
      </Box>

      {/* Center - Agent Selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={(e) => setAgentMenuAnchor(e.currentTarget)}
          endIcon={<ExpandMore />}
          sx={{
            borderRadius: '20px',
            px: 2,
            py: 0.5,
            textTransform: 'none',
            borderColor: alpha(getStatusColor(currentAgent?.status || 'ready'), 0.3),
            backgroundColor: alpha(getStatusColor(currentAgent?.status || 'ready'), 0.05),
            '&:hover': {
              backgroundColor: alpha(getStatusColor(currentAgent?.status || 'ready'), 0.1),
            }
          }}
        >
          <Avatar 
            sx={{ 
              width: 24, 
              height: 24, 
              mr: 1,
              bgcolor: getStatusColor(currentAgent?.status || 'ready'),
            }}
          >
            {React.createElement(getAgentIcon(selectedAgent), { sx: { fontSize: 14, color: 'white' } })}
          </Avatar>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {currentAgent?.name || 'General Assistant'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {currentAgent?.confidence || 95}% confidence
            </Typography>
          </Box>
        </Button>

        {/* Agent Status Chip */}
        <Chip
          label={currentAgent?.status || 'ready'}
          size="small"
          sx={{
            backgroundColor: alpha(getStatusColor(currentAgent?.status || 'ready'), 0.15),
            color: getStatusColor(currentAgent?.status || 'ready'),
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        />
      </Box>

      {/* Right side - Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Notifications">
          <IconButton size="small">
            <Notifications fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton size="small">
            <Settings fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Agent Selection Menu */}
      <Menu
        anchorEl={agentMenuAnchor}
        open={Boolean(agentMenuAnchor)}
        onClose={() => setAgentMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 280,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Select Active Agent
        </Typography>
        <Divider />
        {agentStatuses.map((agent) => {
          const IconComponent = getAgentIcon(agent.id);
          return (
            <MenuItem
              key={agent.id}
              onClick={() => {
                onAgentChange?.(agent.id);
                setAgentMenuAnchor(null);
              }}
              selected={agent.id === selectedAgent}
              sx={{
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(getStatusColor(agent.status), 0.1),
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  mr: 2,
                  bgcolor: getStatusColor(agent.status),
                }}
              >
                <IconComponent sx={{ fontSize: 18, color: 'white' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {agent.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={agent.status}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getStatusColor(agent.status), 0.15),
                      color: getStatusColor(agent.status),
                      fontSize: 10,
                      height: 18,
                      textTransform: 'capitalize',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {agent.confidence}% confidence
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default Header; 