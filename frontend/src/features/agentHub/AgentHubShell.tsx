import React, { useCallback } from 'react';
import { Box, TextField, IconButton, ToggleButton, ToggleButtonGroup, CircularProgress, Toolbar, Typography } from '@mui/material';
import { Search, ViewModule, ViewList, AccountTreeOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { setSearchTerm, setViewMode, ViewMode } from './agentHubSlice';
import { useGetAgentsQuery } from './api/agentApi';
import AgentGrid from './components/AgentGrid';

const AgentHubShell: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchTerm = useAppSelector((state) => state.agentHub.searchTerm);
  const viewMode = useAppSelector((state) => state.agentHub.viewMode);

  const { data: agents = [], isLoading, isError, refetch } = useGetAgentsQuery();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleViewMode = (_: React.MouseEvent<HTMLElement>, next: ViewMode | null) => {
    if (next) dispatch(setViewMode(next));
  };

  const filtered = agents.filter((agent) =>
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
          <ToggleButton value="grid"><ViewModule fontSize="small" /></ToggleButton>
          <ToggleButton value="list"><ViewList fontSize="small" /></ToggleButton>
          <ToggleButton value="graph"><AccountTreeOutlined fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
        <IconButton size="small" onClick={() => refetch()}><Search /></IconButton>
      </Toolbar>
      {renderContent()}
    </Box>
  );
};

export default AgentHubShell;
