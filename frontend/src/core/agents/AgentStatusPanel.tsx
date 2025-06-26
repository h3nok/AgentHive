import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Chip,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Refresh,
  Settings,
  TrendingUp,
  Memory,
  Speed,
  Psychology,
  AutoMode
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AgentStatusIndicator, { AgentStatus } from './AgentStatusIndicator';

interface AgentStatusPanelProps {
  agents: AgentStatus[];
  selectedAgentId?: string;
  onAgentSelect?: (agentId: string) => void;
  showBackgroundTasks?: boolean;
  realTimeUpdates?: boolean;
  onRefresh?: () => void;
  onSettings?: () => void;
}

const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  showBackgroundTasks = true,
  realTimeUpdates = true,
  onRefresh,
  onSettings
}) => {
  const theme = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState([
    { id: 1, name: 'Context Analysis', progress: 85, agent: 'general' },
    { id: 2, name: 'Memory Optimization', progress: 92, agent: 'technical' },
    { id: 3, name: 'Pattern Recognition', progress: 67, agent: 'business' }
  ]);

  // Simulate background task updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      setBackgroundTasks(prev =>
        prev.map(task => ({
          ...task,
          progress: Math.min(100, task.progress + Math.random() * 5)
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  const getOverallSystemStatus = () => {
    const readyAgents = agents.filter(a => a.status === 'ready').length;
    const totalAgents = agents.length;
    const avgConfidence = agents.reduce((sum, a) => sum + a.confidence, 0) / totalAgents;
    const avgResponseTime = agents.reduce((sum, a) => sum + a.responseTime, 0) / totalAgents;

    return {
      readyAgents,
      totalAgents,
      avgConfidence: Math.round(avgConfidence),
      avgResponseTime: Math.round(avgResponseTime),
      systemHealth: readyAgents / totalAgents > 0.75 ? 'excellent' : 
                   readyAgents / totalAgents > 0.5 ? 'good' : 'degraded'
    };
  };

  const systemStatus = getOverallSystemStatus();

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#4caf50';
      case 'good': return '#ff9800';
      case 'degraded': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={3}
        sx={{
          width: isCollapsed ? 60 : 320,
          height: 'fit-content',
          maxHeight: '80vh',
          overflowY: 'auto',
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {!isCollapsed && (
              <>
                <Psychology sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                  Agent Status
                </Typography>
              </>
            )}
            
            <Stack direction="row" spacing={0.5}>
              {!isCollapsed && onRefresh && (
                <Tooltip title="Refresh Status">
                  <IconButton size="small" onClick={onRefresh}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {!isCollapsed && onSettings && (
                <Tooltip title="Agent Settings">
                  <IconButton size="small" onClick={onSettings}>
                    <Settings fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title={isCollapsed ? "Expand Panel" : "Collapse Panel"}>
                <IconButton size="small" onClick={() => setIsCollapsed(!isCollapsed)}>
                  {isCollapsed ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* System Overview - Only when expanded */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Badge
                    badgeContent=""
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: getSystemHealthColor(systemStatus.systemHealth),
                        width: 8,
                        height: 8,
                        borderRadius: '50%'
                      }
                    }}
                  >
                    <TrendingUp fontSize="small" color="primary" />
                  </Badge>
                  <Typography variant="caption" fontWeight={500}>
                    System Health: {systemStatus.systemHealth.toUpperCase()}
                  </Typography>
                </Stack>
                
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    icon={<AutoMode />}
                    label={`${systemStatus.readyAgents}/${systemStatus.totalAgents} Ready`}
                    size="small"
                    color={systemStatus.readyAgents === systemStatus.totalAgents ? 'success' : 'warning'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                  <Chip
                    icon={<Psychology />}
                    label={`${systemStatus.avgConfidence}% Confidence`}
                    size="small"
                    color={systemStatus.avgConfidence > 80 ? 'success' : 'warning'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                  <Chip
                    icon={<Speed />}
                    label={`${systemStatus.avgResponseTime}ms`}
                    size="small"
                    color={systemStatus.avgResponseTime < 500 ? 'success' : 'warning'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Stack>
              </Box>
            </motion.div>
          )}
        </Box>

        {/* Agents List */}
        <Box sx={{ p: isCollapsed ? 1 : 2 }}>
          <AnimatePresence>
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
              >
                <Box sx={{ mb: 1.5 }}>
                  {isCollapsed ? (
                    // Collapsed view - just status dots
                    <Tooltip title={`${agent.name} - ${agent.status}`} placement="left">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          border: selectedAgentId === agent.id ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                          bgcolor: selectedAgentId === agent.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                        onClick={() => onAgentSelect?.(agent.id)}
                      >
                        <Badge
                          badgeContent=""
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: agent.status === 'ready' ? '#4caf50' : 
                                            agent.status === 'thinking' ? '#2196f3' :
                                            agent.status === 'processing' ? '#ff9800' : '#f44336',
                              width: 8,
                              height: 8,
                              borderRadius: '50%'
                            }
                          }}
                        >
                          <Typography variant="caption" fontWeight="bold">
                            {agent.name.charAt(0)}
                          </Typography>
                        </Badge>
                      </Box>
                    </Tooltip>
                  ) : (
                    // Expanded view - full status
                    <AgentStatusIndicator
                      agent={agent}
                      isSelected={selectedAgentId === agent.id}
                      showDetails={true}
                      onSelect={onAgentSelect}
                      realTimeUpdates={realTimeUpdates}
                    />
                  )}
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>

        {/* Background Tasks - Only when expanded */}
        {!isCollapsed && showBackgroundTasks && backgroundTasks.length > 0 && (
          <>
            <Divider sx={{ mx: 2 }} />
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Background Tasks
              </Typography>
              <Stack spacing={1}>
                {backgroundTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Memory fontSize="small" sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="caption" fontWeight={500} sx={{ flex: 1 }}>
                          {task.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(task.progress)}%
                        </Typography>
                      </Stack>
                      <Box
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          overflow: 'hidden'
                        }}
                      >
                        <motion.div
                          style={{
                            height: '100%',
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: 2
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </motion.div>
  );
};

export default AgentStatusPanel;
