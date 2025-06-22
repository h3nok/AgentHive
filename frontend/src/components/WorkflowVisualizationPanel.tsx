import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Divider,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  MoreVert,
  CheckCircle,
  Error,
  Schedule,
  Psychology,
  Person,
  Code,
  Analytics,
  Refresh,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Share,
  Edit
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'human' | 'system' | 'condition' | 'parallel';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval' | 'skipped';
  agent?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  input?: any;
  output?: any;
  error?: string;
  dependencies?: string[];
  position: { x: number; y: number };
  description?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  steps: WorkflowStep[];
  connections: Array<{
    from: string;
    to: string;
    condition?: string;
  }>;
  estimatedDuration?: number;
  actualDuration?: number;
}

interface WorkflowVisualizationPanelProps {
  workflow: Workflow;
  onStepClick?: (stepId: string) => void;
  onWorkflowControl?: (action: 'play' | 'pause' | 'stop' | 'restart') => void;
  onEditWorkflow?: () => void;
  onShareWorkflow?: () => void;
  height?: number;
  interactive?: boolean;
}

const WorkflowVisualizationPanel: React.FC<WorkflowVisualizationPanelProps> = ({
  workflow,
  onStepClick,
  onWorkflowControl,
  onEditWorkflow,
  onShareWorkflow,
  height = 400,
  interactive = true
}) => {
  const theme = useTheme();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleStepClick = useCallback((stepId: string) => {
    setSelectedStep(stepId);
    onStepClick?.(stepId);
  }, [onStepClick]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'running': return theme.palette.warning.main;
      case 'failed': return theme.palette.error.main;
      case 'waiting_approval': return theme.palette.info.main;
      case 'skipped': return theme.palette.text.disabled;
      default: return theme.palette.text.secondary;
    }
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.type) {
      case 'agent': return <Psychology fontSize="small" />;
      case 'human': return <Person fontSize="small" />;
      case 'system': return <Code fontSize="small" />;
      case 'condition': return <Analytics fontSize="small" />;
      default: return <CheckCircle fontSize="small" />;
    }
  };

  const getWorkflowStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'running': return theme.palette.warning.main;
      case 'failed': return theme.palette.error.main;
      case 'cancelled': return theme.palette.text.disabled;
      default: return theme.palette.text.secondary;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const completedSteps = workflow.steps.filter(step => step.status === 'completed').length;
  const totalSteps = workflow.steps.length;

  return (
    <Paper 
      elevation={1}
      sx={{ 
        height: height,
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {workflow.name}
              </Typography>
              <Chip
                size="small"
                label={workflow.status}
                sx={{
                  bgcolor: alpha(getWorkflowStatusColor(workflow.status), 0.1),
                  color: getWorkflowStatusColor(workflow.status),
                  border: `1px solid ${alpha(getWorkflowStatusColor(workflow.status), 0.2)}`,
                  height: 20,
                  fontSize: '0.7rem'
                }}
              />
            </Stack>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {workflow.description}
            </Typography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="caption">
                Progress: {completedSteps}/{totalSteps} steps
              </Typography>
              <Typography variant="caption">
                {workflow.actualDuration ? formatDuration(workflow.actualDuration) : 
                 workflow.estimatedDuration ? `Est. ${formatDuration(workflow.estimatedDuration)}` : ''}
              </Typography>
            </Stack>
            
            <LinearProgress
              variant="determinate"
              value={workflow.progress}
              sx={{
                mt: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }}
            />
          </Box>

          <Stack direction="row" spacing={1}>
            {workflow.status === 'running' && (
              <IconButton 
                size="small" 
                onClick={() => onWorkflowControl?.('pause')}
                sx={{ color: theme.palette.warning.main }}
              >
                <Pause fontSize="small" />
              </IconButton>
            )}
            
            {(workflow.status === 'paused' || workflow.status === 'draft') && (
              <IconButton 
                size="small" 
                onClick={() => onWorkflowControl?.('play')}
                sx={{ color: theme.palette.success.main }}
              >
                <PlayArrow fontSize="small" />
              </IconButton>
            )}
            
            {workflow.status === 'running' && (
              <IconButton 
                size="small" 
                onClick={() => onWorkflowControl?.('stop')}
                sx={{ color: theme.palette.error.main }}
              >
                <Stop fontSize="small" />
              </IconButton>
            )}
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Workflow Canvas */}
      <Box
        sx={{
          position: 'relative',
          height: height - 120,
          overflow: 'hidden',
          bgcolor: alpha(theme.palette.background.default, 0.5)
        }}
      >
        {/* Zoom Controls */}
        <Stack
          direction="column"
          spacing={1}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10
          }}
        >
          <IconButton
            size="small"
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
            sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8) }}
          >
            <ZoomIn fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8) }}
          >
            <ZoomOut fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8) }}
          >
            <CenterFocusStrong fontSize="small" />
          </IconButton>
        </Stack>

        {/* Workflow Steps */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Connection Lines */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            {workflow.connections.map((connection, index) => {
              const fromStep = workflow.steps.find(s => s.id === connection.from);
              const toStep = workflow.steps.find(s => s.id === connection.to);
              
              if (!fromStep || !toStep) return null;
              
              return (
                <line
                  key={index}
                  x1={fromStep.position.x + 50}
                  y1={fromStep.position.y + 25}
                  x2={toStep.position.x + 50}
                  y2={toStep.position.y + 25}
                  stroke={alpha(theme.palette.primary.main, 0.3)}
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={alpha(theme.palette.primary.main, 0.3)}
                />
              </marker>
            </defs>
          </svg>

          {/* Step Nodes */}
          {workflow.steps.map((step) => (
            <motion.div
              key={step.id}
              style={{
                position: 'absolute',
                left: step.position.x,
                top: step.position.y,
                zIndex: 2
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                sx={{
                  width: 100,
                  height: 50,
                  cursor: interactive ? 'pointer' : 'default',
                  border: selectedStep === step.id ? 
                    `2px solid ${theme.palette.primary.main}` :
                    `1px solid ${alpha(getStepStatusColor(step.status), 0.3)}`,
                  bgcolor: alpha(getStepStatusColor(step.status), 0.1),
                  '&:hover': interactive ? {
                    boxShadow: theme.shadows[4],
                    bgcolor: alpha(getStepStatusColor(step.status), 0.15)
                  } : {}
                }}
                onClick={() => interactive && handleStepClick(step.id)}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: getStepStatusColor(step.status),
                        fontSize: '0.7rem'
                      }}
                    >
                      {getStepIcon(step)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.65rem',
                          lineHeight: 1.2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {step.name}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  {step.status === 'running' && (
                    <LinearProgress
                      sx={{
                        mt: 0.5,
                        height: 2,
                        borderRadius: 1
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>
      </Box>

      {/* Selected Step Details */}
      <AnimatePresence>
        {selectedStep && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {(() => {
              const step = workflow.steps.find(s => s.id === selectedStep);
              if (!step) return null;
              
              return (
                <Box
                  sx={{
                    p: 2,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.5)
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {step.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={step.status}
                      sx={{
                        bgcolor: alpha(getStepStatusColor(step.status), 0.1),
                        color: getStepStatusColor(step.status)
                      }}
                    />
                  </Stack>
                  
                  {step.description && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {step.description}
                    </Typography>
                  )}
                  
                  <Stack direction="row" spacing={2}>
                    {step.agent && (
                      <Typography variant="caption">
                        Agent: {step.agent}
                      </Typography>
                    )}
                    {step.duration && (
                      <Typography variant="caption">
                        Duration: {formatDuration(step.duration)}
                      </Typography>
                    )}
                  </Stack>
                  
                  {step.error && (
                    <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                      <Typography variant="caption">{step.error}</Typography>
                    </Alert>
                  )}
                </Box>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEditWorkflow?.(); handleMenuClose(); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Workflow
        </MenuItem>
        <MenuItem onClick={() => { onShareWorkflow?.(); handleMenuClose(); }}>
          <Share fontSize="small" sx={{ mr: 1 }} />
          Share Workflow
        </MenuItem>
        <MenuItem onClick={() => { onWorkflowControl?.('restart'); handleMenuClose(); }}>
          <Refresh fontSize="small" sx={{ mr: 1 }} />
          Restart Workflow
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default WorkflowVisualizationPanel;
