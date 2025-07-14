import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  LinearProgress,
  Chip,
  Tooltip,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  SmartToy,
  Add,
  MoreVert,
  Search,
  FilterList,
  Refresh,
  Settings,
  Group,
  Psychology,
  AutoGraph,
  Hub,
  ViewModule,
  ViewList,
  AccountTreeOutlined
} from '@mui/icons-material';

interface Agent {
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

const AgentOrchestrationDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'graph'>('grid');
  
  // Sample data
  const agents: Agent[] = [
    {
      id: 'agent-1',
      name: 'Workflow Orchestrator',
      type: 'orchestrator',
      status: 'online',
      capabilities: ['workflow_management', 'agent_coordination'],
      cpu: 45,
      memory: 32,
      tasksCompleted: 1247,
      successRate: 98.5,
      responseTime: 1.2
    },
    {
      id: 'agent-2',
      name: 'Data Analyzer',
      type: 'analyst',
      status: 'online',
      capabilities: ['data_analysis', 'report_generation'],
      cpu: 67,
      memory: 45,
      tasksCompleted: 892,
      successRate: 95.2,
      responseTime: 2.1
    },
    {
      id: 'agent-3',
      name: 'Document Processor',
      type: 'specialist',
      status: 'busy',
      capabilities: ['document_parsing', 'text_extraction'],
      cpu: 82,
      memory: 56,
      tasksCompleted: 2341,
      successRate: 99.1,
      responseTime: 0.8
    },
    {
      id: 'agent-4',
      name: 'Customer Support',
      type: 'assistant',
      status: 'online',
      capabilities: ['customer_interaction', 'ticket_management'],
      cpu: 23,
      memory: 12,
      tasksCompleted: 567,
      successRate: 97.8,
      responseTime: 1.5
    },
    {
      id: 'agent-5',
      name: 'API Gateway',
      type: 'orchestrator',
      status: 'error',
      capabilities: ['api_routing', 'rate_limiting'],
      cpu: 92,
      memory: 78,
      tasksCompleted: 4532,
      successRate: 99.9,
      responseTime: 0.3
    },
    {
      id: 'agent-6',
      name: 'Report Generator',
      type: 'analyst',
      status: 'offline',
      capabilities: ['report_generation', 'data_visualization'],
      cpu: 0,
      memory: 0,
      tasksCompleted: 321,
      successRate: 96.7,
      responseTime: 3.2
    }
  ];

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success.main';
      case 'busy': return 'warning.main';
      case 'error': return 'error.main';
      case 'offline': return 'text.disabled';
      default: return 'text.secondary';
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'orchestrator': return <Hub />;
      case 'specialist': return <Psychology />;
      case 'assistant': return <SmartToy />;
      case 'analyst': return <AutoGraph />;
      default: return <SmartToy />;
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Agent Orchestration Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage and monitor your AI agents in real-time
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={() => {}}
          >
            New Agent
          </Button>
        </Box>
      </Box>
      
      {/* Search and Filter */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <TextField
          placeholder="Search agents..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
            sx: { 
              minWidth: 250,
              '& .MuiOutlinedInput-input': { 
                py: '8.5px' 
              } 
            }
          }}
        />
        
        <Button 
          variant="outlined" 
          startIcon={<FilterList />}
          sx={{ minWidth: 'auto' }}
        >
          Filters
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Tooltip title="Grid View">
            <IconButton 
              size="small" 
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <ViewModule />
            </IconButton>
          </Tooltip>
          <Tooltip title="List View">
            <IconButton 
              size="small" 
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ViewList />
            </IconButton>
          </Tooltip>
          <Tooltip title="Graph View">
            <IconButton 
              size="small" 
              onClick={() => setViewMode('graph')}
              color={viewMode === 'graph' ? 'primary' : 'default'}
            >
              <AccountTreeOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Agent Grid */}
      <Grid container spacing={3} sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredAgents.map((agent) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
            <Card 
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                },
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getAgentStatusColor(agent.status),
                  border: '2px solid white'
                }}
              />
              
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getAgentTypeIcon(agent.type)}
                  </Avatar>
                }
                action={
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                }
                title={
                  <Typography variant="subtitle1" noWrap>
                    {agent.name}
                  </Typography>
                }
                subheader={
                  <Typography variant="caption" color="textSecondary">
                    {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)}
                  </Typography>
                }
                sx={{ pb: 1 }}
              />
              
              <CardContent sx={{ pt: 0, pb: '8px !important' }}>
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
                          '& .MuiChip-label': { px: 0.75 }
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
                          '& .MuiChip-label': { px: 0.75 }
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
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
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AgentOrchestrationDashboard;
