import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Fab,
  Zoom,
  alpha,
  useTheme
} from '@mui/material';
import {
  SmartToy,
  Psychology,
  Hub,
  TrendingUp,
  Speed,
  AutoAwesome,
  Refresh,
  Fullscreen,
  Settings,
  Timeline,
  DeviceHub,
  Memory,
  ElectricBolt,
  Router,
  DataObject,
  Analytics
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentNode {
  id: string;
  name: string;
  type: 'specialist' | 'coordinator' | 'analyzer' | 'executor';
  status: 'active' | 'busy' | 'idle' | 'offline';
  position: { x: number; y: number };
  connections: string[];
  currentTask?: string;
  performance: {
    efficiency: number;
    throughput: number;
    quality: number;
  };
  workload: number;
  specialization: string[];
}

interface CollaborationFlow {
  id: string;
  from: string;
  to: string;
  type: 'data' | 'command' | 'result' | 'feedback';
  intensity: number;
  timestamp: string;
}

const AgentOrchestrationDashboard: React.FC = () => {
  const theme = useTheme();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeFlows, setActiveFlows] = useState<CollaborationFlow[]>([]);
  const [viewMode, setViewMode] = useState<'network' | 'hierarchy' | 'performance'>('network');

  const agents: AgentNode[] = [
    {
      id: 'hr-agent',
      name: 'HR Specialist',
      type: 'specialist',
      status: 'active',
      position: { x: 150, y: 100 },
      connections: ['policy-agent', 'notification-agent', 'orchestrator'],
      currentTask: 'Processing time-off request',
      performance: { efficiency: 94, throughput: 87, quality: 96 },
      workload: 65,
      specialization: ['Employee Relations', 'Policy Compliance', 'Benefits']
    },
    {
      id: 'finance-agent',
      name: 'Finance Analyst',
      type: 'specialist',
      status: 'busy',
      position: { x: 350, y: 80 },
      connections: ['compliance-agent', 'data-agent', 'orchestrator'],
      currentTask: 'Expense report validation',
      performance: { efficiency: 91, throughput: 93, quality: 98 },
      workload: 78,
      specialization: ['Budget Analysis', 'Expense Processing', 'Financial Reporting']
    },
    {
      id: 'orchestrator',
      name: 'Workflow Orchestrator',
      type: 'coordinator',
      status: 'active',
      position: { x: 250, y: 200 },
      connections: ['hr-agent', 'finance-agent', 'it-agent', 'analytics-agent'],
      currentTask: 'Coordinating multi-agent workflow',
      performance: { efficiency: 96, throughput: 89, quality: 94 },
      workload: 45,
      specialization: ['Process Coordination', 'Resource Allocation', 'Workflow Management']
    },
    {
      id: 'analytics-agent',
      name: 'Analytics Engine',
      type: 'analyzer',
      status: 'active',
      position: { x: 450, y: 180 },
      connections: ['orchestrator', 'data-agent'],
      currentTask: 'Performance trend analysis',
      performance: { efficiency: 98, throughput: 95, quality: 97 },
      workload: 52,
      specialization: ['Data Mining', 'Predictive Analysis', 'Reporting']
    },
    {
      id: 'it-agent',
      name: 'IT Operations',
      type: 'executor',
      status: 'idle',
      position: { x: 150, y: 280 },
      connections: ['orchestrator', 'security-agent'],
      currentTask: undefined,
      performance: { efficiency: 92, throughput: 88, quality: 95 },
      workload: 23,
      specialization: ['System Administration', 'Account Management', 'Infrastructure']
    },
    {
      id: 'policy-agent',
      name: 'Policy Validator',
      type: 'specialist',
      status: 'active',
      position: { x: 50, y: 150 },
      connections: ['hr-agent', 'compliance-agent'],
      currentTask: 'Policy compliance check',
      performance: { efficiency: 89, throughput: 85, quality: 99 },
      workload: 67,
      specialization: ['Regulatory Compliance', 'Policy Interpretation', 'Risk Assessment']
    }
  ];

  const getAgentColor = (type: string, status: string) => {
    const baseColors = {
      specialist: theme.palette.primary.main,
      coordinator: theme.palette.secondary.main,
      analyzer: theme.palette.info.main,
      executor: theme.palette.success.main
    };

    const statusAlpha = {
      active: 1,
      busy: 0.8,
      idle: 0.4,
      offline: 0.2
    };

    return alpha(baseColors[type as keyof typeof baseColors], statusAlpha[status as keyof typeof statusAlpha]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ElectricBolt sx={{ fontSize: 16, color: theme.palette.success.main }} />;
      case 'busy': return <Speed sx={{ fontSize: 16, color: theme.palette.warning.main }} />;
      case 'idle': return <Memory sx={{ fontSize: 16, color: theme.palette.text.secondary }} />;
      case 'offline': return <DeviceHub sx={{ fontSize: 16, color: theme.palette.text.disabled }} />;
      default: return null;
    }
  };

  const generateActiveFlows = useCallback(() => {
    const flows: CollaborationFlow[] = [];
    agents.forEach(agent => {
      if (agent.status === 'active' || agent.status === 'busy') {
        agent.connections.forEach(connId => {
          if (Math.random() > 0.6) {
            flows.push({
              id: `${agent.id}-${connId}-${Date.now()}`,
              from: agent.id,
              to: connId,
              type: Math.random() > 0.5 ? 'data' : 'command',
              intensity: Math.random() * 100,
              timestamp: new Date().toISOString()
            });
          }
        });
      }
    });
    setActiveFlows(flows);
  }, []);

  useEffect(() => {
    generateActiveFlows();
    const interval = setInterval(generateActiveFlows, 3000);
    return () => clearInterval(interval);
  }, [generateActiveFlows]);

  const handleAgentClick = useCallback((agentId: string) => {
    setSelectedAgent(selectedAgent === agentId ? null : agentId);
  }, [selectedAgent]);

  const selectedAgentData = selectedAgent ? agents.find(a => a.id === selectedAgent) : null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="body1" color="text.secondary">
              Real-time visualization of autonomous agent collaboration and workflow execution
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh Network">
              <IconButton onClick={generateActiveFlows}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fullscreen View">
              <IconButton>
                <Fullscreen />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <Settings />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* View Mode Toggle */}
        <Stack direction="row" spacing={1}>
          {[
            { mode: 'network', label: 'Network View', icon: <Hub /> },
            { mode: 'hierarchy', label: 'Hierarchy', icon: <Timeline /> },
            { mode: 'performance', label: 'Performance', icon: <Analytics /> }
          ].map(({ mode, label, icon }) => (
            <Chip
              key={mode}
              label={label}
              icon={icon}
              clickable
              variant={viewMode === mode ? 'filled' : 'outlined'}
              onClick={() => setViewMode(mode as typeof viewMode)}
              sx={{
                backgroundColor: viewMode === mode 
                  ? alpha(theme.palette.primary.main, 0.1) 
                  : 'transparent'
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main Visualization Area */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Paper 
            sx={{ 
              height: '100%', 
              margin: 2, 
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              background: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 50%)`
            }}
          >
            {/* Network Visualization */}
            <Box sx={{ position: 'relative', width: '100%', height: '100%', p: 2 }}>
              <svg 
                width="100%" 
                height="100%" 
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
              >
                {/* Connection Lines */}
                {agents.map(agent => 
                  agent.connections.map(connId => {
                    const connectedAgent = agents.find(a => a.id === connId);
                    if (!connectedAgent) return null;
                    
                    const flow = activeFlows.find(f => 
                      (f.from === agent.id && f.to === connId) || 
                      (f.from === connId && f.to === agent.id)
                    );
                    
                    return (
                      <motion.line
                        key={`${agent.id}-${connId}`}
                        x1={agent.position.x}
                        y1={agent.position.y}
                        x2={connectedAgent.position.x}
                        y2={connectedAgent.position.y}
                        stroke={flow ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}
                        strokeWidth={flow ? 3 : 1}
                        strokeDasharray={flow ? "0" : "5,5"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                    );
                  })
                )}
                
                {/* Data Flow Animations */}
                {activeFlows.map(flow => {
                  const fromAgent = agents.find(a => a.id === flow.from);
                  const toAgent = agents.find(a => a.id === flow.to);
                  if (!fromAgent || !toAgent) return null;
                  
                  return (
                    <motion.circle
                      key={flow.id}
                      r="4"
                      fill={theme.palette.secondary.main}
                      initial={{ 
                        cx: fromAgent.position.x, 
                        cy: fromAgent.position.y,
                        opacity: 1
                      }}
                      animate={{ 
                        cx: toAgent.position.x, 
                        cy: toAgent.position.y,
                        opacity: 0
                      }}
                      transition={{ 
                        duration: 2,
                        ease: "easeInOut"
                      }}
                    />
                  );
                })}
              </svg>

              {/* Agent Nodes */}
              {agents.map(agent => (
                <Tooltip 
                  key={agent.id} 
                  title={`${agent.name} - ${agent.currentTask || 'Idle'}`}
                  placement="top"
                >
                  <motion.div
                    style={{
                      position: 'absolute',
                      left: agent.position.x - 30,
                      top: agent.position.y - 30,
                      zIndex: 2
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAgentClick(agent.id)}
                  >
                    <Card 
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: selectedAgent === agent.id 
                          ? `3px solid ${theme.palette.primary.main}` 
                          : `2px solid ${getAgentColor(agent.type, agent.status)}`,
                        backgroundColor: alpha(getAgentColor(agent.type, agent.status), 0.1),
                        '&:hover': {
                          backgroundColor: alpha(getAgentColor(agent.type, agent.status), 0.2)
                        }
                      }}
                    >
                      <Stack alignItems="center" spacing={0.5}>
                        <SmartToy 
                          sx={{ 
                            fontSize: 20, 
                            color: getAgentColor(agent.type, agent.status) 
                          }} 
                        />
                        {getStatusIcon(agent.status)}
                      </Stack>
                    </Card>
                  </motion.div>
                </Tooltip>
              ))}

              {/* Network Stats Overlay */}
              <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
                <Stack spacing={1}>
                  <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <DeviceHub sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {agents.filter(a => a.status === 'active').length} Active Agents
                      </Typography>
                    </Stack>
                  </Paper>
                  <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <DataObject sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {activeFlows.length} Active Flows
                      </Typography>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Side Panel - Agent Details */}
        <AnimatePresence>
          {selectedAgentData && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <Paper sx={{ height: '100%', margin: 2, marginLeft: 0, borderRadius: 2, overflow: 'auto' }}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                    <Avatar
                      sx={{
                        bgcolor: getAgentColor(selectedAgentData.type, selectedAgentData.status),
                        width: 50,
                        height: 50
                      }}
                    >
                      <SmartToy />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedAgentData.name}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip 
                          label={selectedAgentData.type}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                        {getStatusIcon(selectedAgentData.status)}
                      </Stack>
                    </Box>
                  </Stack>

                  {/* Current Task */}
                  {selectedAgentData.currentTask && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Current Task
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedAgentData.currentTask}
                      </Typography>
                    </Box>
                  )}

                  {/* Performance Metrics */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                      Performance Metrics
                    </Typography>
                    <Stack spacing={2}>
                      {Object.entries(selectedAgentData.performance).map(([key, value]) => (
                        <Box key={key}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {key}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {value}%
                            </Typography>
                          </Stack>
                          <Box
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.divider, 0.2),
                              overflow: 'hidden'
                            }}
                          >
                            <motion.div
                              style={{
                                height: '100%',
                                background: `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
                                borderRadius: 2
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {/* Workload */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Current Workload
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.divider, 0.2),
                            overflow: 'hidden'
                          }}
                        >
                          <motion.div
                            style={{
                              height: '100%',
                              background: selectedAgentData.workload > 70 
                                ? `linear-gradient(90deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`
                                : `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                              borderRadius: 4
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedAgentData.workload}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedAgentData.workload}%
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Specializations */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Specializations
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedAgentData.specialization.map((spec, idx) => (
                        <Chip
                          key={idx}
                          label={spec}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Connections */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Connected Agents
                    </Typography>
                    <Stack spacing={1}>
                      {selectedAgentData.connections.map(connId => {
                        const connectedAgent = agents.find(a => a.id === connId);
                        if (!connectedAgent) return null;
                        
                        return (
                          <Stack key={connId} direction="row" alignItems="center" spacing={1}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: getAgentColor(connectedAgent.type, connectedAgent.status)
                              }}
                            >
                              <SmartToy sx={{ fontSize: 12 }} />
                            </Avatar>
                            <Typography variant="body2">
                              {connectedAgent.name}
                            </Typography>
                            {getStatusIcon(connectedAgent.status)}
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Floating Action Button for Network Controls */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
        }}
        onClick={generateActiveFlows}
      >
        <AutoAwesome />
      </Fab>
    </Box>
  );
};

export default AgentOrchestrationDashboard;
