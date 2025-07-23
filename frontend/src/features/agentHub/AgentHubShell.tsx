import React, { useCallback, useState, useMemo } from 'react';
import { Box, TextField, IconButton, ToggleButton, ToggleButtonGroup, CircularProgress, Toolbar, Typography } from '@mui/material';
import { Search, ViewModule, ViewList, AccountTreeOutlined } from '@mui/icons-material';
import { useAppSelector } from '@/shared/store';
import { selectAllAgents } from '@/shared/store';
import AgentGrid from './components/AgentGrid';

// Extended Agent interface matching AgentCard expectations
interface ExtendedAgent {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
  cpu: number;
  memory: number;
  tasksCompleted: number;
  successRate: number;
  responseTime: number;
}

// ViewMode enum for local state management
export enum ViewMode {
  GRID = 'grid',
  LIST = 'list',
  GRAPH = 'graph'
}

const AgentHubShell: React.FC = () => {
  // Local state for search and view mode (no need for global state)
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  
  // Get agents from consolidated store
  const rawAgents = useAppSelector(selectAllAgents) || [];
  const isLoading = false; // Simplified for now - can be enhanced later
  const error = null; // Simplified for now - can be enhanced later
  const isError = error !== null;
  
  // Transform agents to match AgentCard interface expectations
  const agents = useMemo(() => 
    rawAgents.map(agent => ({
      ...agent,
      type: agent.type as 'orchestrator' | 'specialist' | 'assistant' | 'analyst',
      status: 'active' as const,
      capabilities: ['chat', 'analysis'],
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      tasksCompleted: Math.floor(Math.random() * 1000),
      successRate: Math.floor(Math.random() * 100),
      responseTime: Math.floor(Math.random() * 500) + 100
    } as ExtendedAgent)), [rawAgents]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewMode = (_: React.MouseEvent<HTMLElement>, next: ViewMode | null) => {
    if (next) setViewMode(next);
  };

  const filtered = agents.filter((agent: ExtendedAgent) =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = useCallback(() => {
    if (isLoading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    if (isError) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="error">Failed to load agents</Typography></Box>;
    if (!filtered.length) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>No agents found</Typography></Box>;
    switch (viewMode) {
      case 'grid':
        return <AgentGrid agents={filtered} onAgentMore={() => {}} />;
      case 'list':
        return <Typography variant="body2" sx={{ p: 4 }}>List view coming soon…</Typography>;
      case 'graph':
        return <Typography variant="body2" sx={{ p: 4 }}>Graph view coming soon…</Typography>;
      default:
        return null;
    }
  }, [isLoading, isError, filtered, viewMode]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 2 }}>
        <TextField
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search agents…"
          InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1 }} /> }}
        />
        <ToggleButtonGroup exclusive size="small" value={viewMode} onChange={handleViewMode}>
          <ToggleButton value={ViewMode.GRID} aria-label="grid view">
            <ViewModule />
          </ToggleButton>
          <ToggleButton value={ViewMode.LIST} aria-label="list view">
            <ViewList />
          </ToggleButton>
          <ToggleButton value={ViewMode.GRAPH} aria-label="graph view">
            <AccountTreeOutlined />
          </ToggleButton>
        </ToggleButtonGroup>
        <IconButton disabled={!!isLoading} aria-label="refresh agents">
          <Search />
        </IconButton>
      </Toolbar>
      {renderContent()}
    </Box>
  );
};

export default AgentHubShell;
