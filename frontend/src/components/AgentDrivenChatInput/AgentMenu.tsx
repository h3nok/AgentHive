import React from 'react';
import { Menu, MenuItem, ListItemIcon, Avatar, ListItemText } from '@mui/material';

// Minimal Agent descriptor required for the menu
export interface Agent {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface AgentMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  agents: Agent[];
  selectedAgent: string;
  onSelect: (agentId: string) => void;
  darkMode: boolean;
}

const AgentMenu: React.FC<AgentMenuProps> = ({
  anchorEl,
  open,
  onClose,
  agents,
  selectedAgent,
  onSelect,
  darkMode,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: -1,
          minWidth: 180,
          bgcolor: darkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        },
      }}
    >
      {agents.map((agent) => (
        <MenuItem
          key={agent.id}
          selected={agent.id === selectedAgent}
          onClick={() => onSelect(agent.id)}
          sx={{
            borderRadius: 1,
            mx: 0.5,
            mb: 0.25,
            '&.Mui-selected': {
              bgcolor: `${agent.color}15`,
            },
          }}
        >
          <ListItemIcon>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                color: '#fff',
                background: `linear-gradient(135deg, ${agent.color} 0%, ${agent.color}bb 100%)`,
                boxShadow: `0 0 0 2px ${agent.color}44`,
                fontSize: '0.7rem',
                transition: 'transform 0.2s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.15) rotate(5deg)',
                  boxShadow: `0 0 0 3px ${agent.color}66`,
                },
              }}
            >
              {agent.icon}
            </Avatar>
          </ListItemIcon>
          <ListItemText primary={agent.name} />
        </MenuItem>
      ))}
    </Menu>
  );
};

export default AgentMenu; 