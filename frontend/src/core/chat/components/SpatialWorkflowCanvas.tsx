import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, Chip, IconButton, alpha, useTheme, keyframes } from '@mui/material';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error,
  Schedule,
  TrendingUp,
  AccountTree,
  AutoAwesome,
  Speed
} from '@mui/icons-material';

interface WorkflowStep {
  id: string;
  name: string;
  agentId: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'paused';
  progress: number; // 0-1
  estimatedTime: number; // minutes
  actualTime?: number;
  dependencies: string[]; // step IDs
  position: { x: number; y: number };
  metadata?: {
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
    resources?: string[];
    outputs?: string[];
  };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'error';
  progress: number; // 0-1 overall progress
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  startTime?: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
}

interface WorkflowConnection {
  fromStepId: string;
  toStepId: string;
  type: 'sequence' | 'parallel' | 'conditional' | 'feedback';
  condition?: string;
  isActive: boolean;
}

export interface SpatialWorkflowCanvasProps {
  workflow: Workflow;
  width: number;
  height: number;
  onStepClick?: (step: WorkflowStep) => void;
  onStepDrag?: (stepId: string, position: { x: number; y: number }) => void;
  onWorkflowControl?: (action: 'play' | 'pause' | 'stop' | 'restart') => void;
  onConnectionClick?: (connection: WorkflowConnection) => void;
  interactive?: boolean;
  showMetrics?: boolean;
  autoLayout?: boolean;
}

// Keyframes for workflow animations
const progressPulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const processingGlow = keyframes`
  0% { box-shadow: 0 0 10px rgba(33, 150, 243, 0.3); }
  50% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.6), 0 0 30px rgba(33, 150, 243, 0.3); }
  100% { box-shadow: 0 0 10px rgba(33, 150, 243, 0.3); }
`;

const completionCelebration = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const SpatialWorkflowCanvas: React.FC<SpatialWorkflowCanvasProps> = ({
  workflow,
  width,
  height,
  onStepClick,
  onStepDrag,
  onWorkflowControl,
  onConnectionClick,
  interactive = true,
  showMetrics = true,
  autoLayout = false
}) => {
  const theme = useTheme();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);

  // Calculate workflow metrics
  const metrics = useMemo(() => {
    const totalSteps = workflow.steps.length;
    const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
    const processingSteps = workflow.steps.filter(s => s.status === 'processing').length;
    const errorSteps = workflow.steps.filter(s => s.status === 'error').length;
    
    const totalEstimatedTime = workflow.steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const actualTimeSpent = workflow.steps.reduce((sum, step) => sum + (step.actualTime || 0), 0);
    
    return {
      totalSteps,
      completedSteps,
      processingSteps,
      errorSteps,
      completionRate: totalSteps > 0 ? completedSteps / totalSteps : 0,
      totalEstimatedTime,
      actualTimeSpent,
      efficiency: totalEstimatedTime > 0 ? actualTimeSpent / totalEstimatedTime : 1
    };
  }, [workflow.steps]);

  // Auto-layout algorithm for workflow steps
  const calculateAutoLayout = useCallback((steps: WorkflowStep[], connections: WorkflowConnection[]) => {
    if (!autoLayout) return steps.map(s => ({ ...s }));

    // Topological sort to determine levels
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const processing = new Set<string>();

    const visit = (stepId: string): number => {
      if (processing.has(stepId)) return 0; // Circular dependency
      if (visited.has(stepId)) return levels.get(stepId) || 0;

      processing.add(stepId);
      
      const dependencies = connections
        .filter(conn => conn.toStepId === stepId)
        .map(conn => conn.fromStepId);
      
      const maxDepLevel = dependencies.length > 0
        ? Math.max(...dependencies.map(depId => visit(depId)))
        : 0;
      
      const level = maxDepLevel + 1;
      levels.set(stepId, level);
      visited.add(stepId);
      processing.delete(stepId);
      
      return level;
    };

    steps.forEach(step => visit(step.id));

    // Position steps based on levels
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, stepId) => {
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level)!.push(stepId);
    });

    const layoutSteps = steps.map(step => {
      const level = levels.get(step.id) || 1;
      const stepsInLevel = levelGroups.get(level) || [];
      const stepIndex = stepsInLevel.indexOf(step.id);
      
      const x = (width / (Math.max(...levels.values()) + 1)) * level;
      const y = (height / (stepsInLevel.length + 1)) * (stepIndex + 1);
      
      return {
        ...step,
        position: { x, y }
      };
    });

    return layoutSteps;
  }, [autoLayout, width, height]);

  const layoutSteps = useMemo(() => 
    calculateAutoLayout(workflow.steps, workflow.connections), 
    [workflow.steps, workflow.connections, calculateAutoLayout]
  );

  // Get step status color
  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'pending': return theme.palette.grey[400];
      case 'processing': return theme.palette.info.main;
      case 'completed': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'paused': return theme.palette.warning.main;
      default: return theme.palette.grey[400];
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[400];
    }
  };

  // Handle step interactions
  const handleStepClick = useCallback((step: WorkflowStep) => {
    setSelectedStep(step.id === selectedStep ? null : step.id);
    onStepClick?.(step);
  }, [selectedStep, onStepClick]);

  const handleStepDrag = useCallback((stepId: string, position: { x: number; y: number }) => {
    onStepDrag?.(stepId, position);
  }, [onStepDrag]);

  // Render workflow connections
  const renderConnections = () => (
    <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={theme.palette.primary.main} opacity="0.7" />
        </marker>
      </defs>
      
      {workflow.connections.map(connection => {
        const fromStep = layoutSteps.find(s => s.id === connection.fromStepId);
        const toStep = layoutSteps.find(s => s.id === connection.toStepId);
        
        if (!fromStep || !toStep) return null;

        const connectionColor = connection.isActive 
          ? theme.palette.primary.main 
          : alpha(theme.palette.primary.main, 0.3);

        return (
          <motion.line
            key={`${connection.fromStepId}-${connection.toStepId}`}
            x1={fromStep.position.x + 50} // Offset for step center
            y1={fromStep.position.y + 25}
            x2={toStep.position.x + 50}
            y2={toStep.position.y + 25}
            stroke={connectionColor}
            strokeWidth={connection.isActive ? 2 : 1}
            strokeDasharray={connection.type === 'conditional' ? "5,5" : "none"}
            markerEnd="url(#arrowhead)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: connection.isActive ? 0.8 : 0.4 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            onClick={() => onConnectionClick?.(connection)}
          />
        );
      })}
    </svg>
  );

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius: 2,
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha('#1a1a2e', 0.95)}, ${alpha('#16213e', 0.95)})`
          : `linear-gradient(135deg, ${alpha('#f8f9fa', 0.95)}, ${alpha('#e9ecef', 0.95)})`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'hidden',
      }}
    >
      {/* Workflow Control Panel */}
      {showMetrics && (
        <Paper
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            p: 2,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            zIndex: 1000,
            minWidth: 300
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {workflow.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton 
                size="small" 
                onClick={() => onWorkflowControl?.('play')}
                disabled={workflow.status === 'running'}
                sx={{ color: theme.palette.success.main }}
              >
                <PlayArrow />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => onWorkflowControl?.('pause')}
                disabled={workflow.status !== 'running'}
                sx={{ color: theme.palette.warning.main }}
              >
                <Pause />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => onWorkflowControl?.('stop')}
                sx={{ color: theme.palette.error.main }}
              >
                <Stop />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${metrics.completedSteps}/${metrics.totalSteps} Steps`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip 
              label={`${Math.round(metrics.completionRate * 100)}%`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={`${Math.round(metrics.actualTimeSpent)}/${metrics.totalEstimatedTime}min`}
              size="small"
              color={metrics.efficiency <= 1 ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Progress:
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: 6,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <motion.div
                style={{
                  height: '100%',
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 3,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${workflow.progress * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* Connection Layer */}
      {renderConnections()}

      {/* Workflow Steps */}
      <AnimatePresence>
        {layoutSteps.map(step => (
          <motion.div
            key={step.id}
            drag={interactive}
            dragControls={useDragControls()}
            dragConstraints={{ left: 0, right: width - 100, top: 0, bottom: height - 50 }}
            onDragEnd={(_, info) => handleStepDrag(step.id, { x: info.point.x, y: info.point.y })}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={interactive ? { scale: 1.05 } : {}}
            style={{
              position: 'absolute',
              left: step.position.x,
              top: step.position.y,
              zIndex: selectedStep === step.id ? 900 : 800,
            }}
          >
            <Paper
              sx={{
                p: 2,
                minWidth: 100,
                cursor: interactive ? 'pointer' : 'default',
                border: `2px solid ${getStepStatusColor(step.status)}`,
                borderRadius: 2,
                background: selectedStep === step.id
                  ? alpha(getStepStatusColor(step.status), 0.1)
                  : alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(8px)',
                boxShadow: step.status === 'processing' 
                  ? `0 0 20px ${alpha(getStepStatusColor(step.status), 0.4)}`
                  : theme.shadows[2],
                animation: step.status === 'processing' 
                  ? `${processingGlow} 2s ease-in-out infinite`
                  : step.status === 'completed'
                  ? `${completionCelebration} 0.6s ease-out`
                  : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={() => handleStepClick(step)}
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }} noWrap>
                  {step.name}
                </Typography>
                {step.metadata?.priority && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: getPriorityColor(step.metadata.priority),
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {step.status === 'processing' && <Schedule sx={{ fontSize: 14, color: theme.palette.info.main }} />}
                {step.status === 'completed' && <CheckCircle sx={{ fontSize: 14, color: theme.palette.success.main }} />}
                {step.status === 'error' && <Error sx={{ fontSize: 14, color: theme.palette.error.main }} />}
                
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {step.agentId}
                </Typography>
              </Box>

              {step.status === 'processing' && (
                <Box
                  sx={{
                    width: '100%',
                    height: 4,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 1
                  }}
                >
                  <motion.div
                    style={{
                      height: '100%',
                      backgroundColor: theme.palette.info.main,
                      borderRadius: 2,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${step.progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {step.estimatedTime}min est.
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Step Detail Panel */}
      {selectedStep && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1100
          }}
        >
          <Paper
            sx={{
              p: 2,
              maxWidth: 280,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            }}
          >
            {(() => {
              const step = layoutSteps.find(s => s.id === selectedStep);
              if (!step) return null;
              
              return (
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
                    {step.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Agent: {step.agentId}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={step.status} 
                      size="small" 
                      style={{ backgroundColor: alpha(getStepStatusColor(step.status), 0.1), color: getStepStatusColor(step.status) }}
                    />
                    {step.metadata?.complexity && (
                      <Chip 
                        label={step.metadata.complexity} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    Progress: {Math.round(step.progress * 100)}%
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    Time: {step.actualTime || 0}/{step.estimatedTime}min
                  </Typography>
                </Box>
              );
            })()}
          </Paper>
        </motion.div>
      )}
    </Box>
  );
};

export default SpatialWorkflowCanvas;
