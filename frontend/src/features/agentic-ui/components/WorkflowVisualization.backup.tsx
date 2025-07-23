/**
 * Enhanced Workflow Visualization Component
 * 
 * Comprehensive workflow visualization with step cards, agent thinking display,
 * and real-time metrics for enterprise users.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Timeline,
  Analytics,
  Psychology
} from '@mui/icons-material';
import { WorkflowVisualizationProps } from '../types';
import WorkflowStepCard from './WorkflowStepCard';
import AgentThinkingDisplay from './AgentThinkingDisplay';
import WorkflowMetricsDashboard from './WorkflowMetricsDashboard';

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  workflow,
  interactive = true,
  showMetrics = true,
  onPause,
  onResume,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const isThinking = workflow.status === 'executing';

  // Mock agent for thinking display
  const mockAgent = {
    id: 'hr-agent-enhanced',
    name: 'HR Assistant',
    type: 'hr' as const,
    framework: 'langchain' as const,
    avatar: '👥',
    status: 'active' as const,
    capabilities: ['employee_data', 'policy_search'],
    description: 'Enhanced HR agent',
    performance: { avgResponseTime: 1.2, successRate: 0.96, totalRequests: 1247 },
    metadata: { version: '2.0', lastActive: new Date(), specializations: ['Benefits'] }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.light' }}>
              <Timeline />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {workflow.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workflow.description}
              </Typography>
            </Box>
          </Stack>
          
          {interactive && (
            <Stack direction="row" spacing={1}>
              {workflow.status === 'executing' && (
                <Button
                  startIcon={<Pause />}
                  onClick={() => onPause?.()}
                  variant="outlined"
                  size="small"
                >
                  Pause
                </Button>
              )}
              
              {workflow.status === 'paused' && (
                <Button
                  startIcon={<PlayArrow />}
                  onClick={() => onResume?.()}
                  variant="contained"
                  size="small"
                >
                  Resume
                </Button>
              )}
              
              <Button
                startIcon={<Stop />}
                onClick={() => onCancel?.()}
                variant="outlined"
                color="error"
                size="small"
              >
                Cancel
              </Button>
            </Stack>
          )}
        </Stack>
        
        {/* Progress */}
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress: {workflow.progress.overall}%
            </Typography>
            <Chip
              label={workflow.status}
              size="small"
              color={
                workflow.status === 'completed' ? 'success' :
                workflow.status === 'executing' ? 'warning' :
                workflow.status === 'error' ? 'error' : 'default'
              }
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={workflow.progress.overall}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Steps" icon={<Timeline />} />
          <Tab label="Agent Thinking" icon={<Psychology />} />
          <Tab label="Metrics" icon={<Analytics />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          <Stack spacing={2}>
            {workflow.steps.map((step) => (
              <WorkflowStepCard
                key={step.id}
                step={step}
                isActive={step.status === 'active'}
                onAction={() => {}}
                showMetrics={showMetrics}
                interactive={interactive}
              />
            ))}
          </Stack>
        )}
        
        {activeTab === 1 && (
          <AgentThinkingDisplay
            agent={mockAgent}
            isThinking={isThinking}
            currentThought="Analyzing employee onboarding data and preparing compliance report..."
          />
        )}
        
        {activeTab === 2 && showMetrics && (
          <WorkflowMetricsDashboard
            workflow={workflow}
            realTimeUpdates={workflow.status === 'executing'}
          />
        )}
      </Box>
    </Box>
  );
};

export default WorkflowVisualization;

// Animated components with custom keyframes
const pulseAnimation = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(1); }
`;

const flowAnimation = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
`;

const progressAnimation = keyframes`
  0% { width: 0%; }
  100% { width: var(--progress-width); }
`;

const StyledWorkflowContainer = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  overflow: 'visible',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '8px 8px 0 0',
  }
}));

const AnimatedStepCard = styled(Paper)<{ status: string }>(({ theme, status }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1, 0),
  borderRadius: theme.spacing(1.5),
  border: `2px solid ${
    status === 'active' ? theme.palette.primary.main :
    status === 'completed' ? theme.palette.success.main :
    status === 'error' ? theme.palette.error.main :
    theme.palette.grey[300]
  }`,
  background: status === 'active' ? theme.palette.primary.light + '10' : theme.palette.background.paper,
  animation: status === 'active' ? `${pulseAnimation} 2s ease-in-out infinite` : 'none',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  }
}));

const ProgressBar = styled(LinearProgress)<{ progress: number }>(({ theme, progress }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    animation: `${progressAnimation} 0.5s ease-out`,
    '--progress-width': `${progress}%`,
  }
}));

const FlowIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '2px',
  background: theme.palette.primary.main,
  opacity: 0,
  animation: `${flowAnimation} 3s ease-in-out infinite`,
  zIndex: 1,
}));

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  workflow,
  interactive = true,
  showMetrics = true,
  onStepClick,
  onPause,
  onResume,
  onCancel
}) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Group steps by type for better visualization
  const stepsByType = useMemo(() => {
    const groups = {
      planning: workflow.steps.filter(step => step.type === 'planning'),
      tool_execution: workflow.steps.filter(step => step.type === 'tool_execution'),
      synthesis: workflow.steps.filter(step => step.type === 'synthesis'),
      validation: workflow.steps.filter(step => step.type === 'validation'),
      handoff: workflow.steps.filter(step => step.type === 'handoff')
    };
    return groups;
  }, [workflow.steps]);

  // Calculate overall progress and timing
  const progressMetrics = useMemo(() => {
    const totalSteps = workflow.steps.length;
    const completedSteps = workflow.steps.filter(step => step.status === 'completed').length;
    const activeSteps = workflow.steps.filter(step => step.status === 'active').length;
    const errorSteps = workflow.steps.filter(step => step.status === 'error').length;

    return {
      overall: (completedSteps / totalSteps) * 100,
      completed: completedSteps,
      active: activeSteps,
      errors: errorSteps,
      total: totalSteps
    };
  }, [workflow.steps]);

  const getStepIcon = (type: string, status: string) => {
    const iconProps = { 
      fontSize: 'small' as const,
      color: status === 'completed' ? 'success' : 
             status === 'error' ? 'error' : 
             status === 'active' ? 'primary' : 'disabled'
    };

    switch (type) {
      case 'planning': return <Psychology {...iconProps} />;
      case 'tool_execution': return <Build {...iconProps} />;
      case 'synthesis': return <Analytics {...iconProps} />;
      case 'validation': return <CheckCircle {...iconProps} />;
      case 'handoff': return <Share {...iconProps} />;
      default: return <Schedule {...iconProps} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'error': return 'error';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const formatDuration = (milliseconds?: number) => {
    if (!milliseconds) return 'N/A';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const handleStepClick = (step: WorkflowStep) => {
    if (interactive) {
      setSelectedStep(selectedStep === step.id ? null : step.id);
      onStepClick?.(step);
    }
  };

  const renderStepGroup = (title: string, steps: WorkflowStep[], icon: React.ReactNode) => {
    if (steps.length === 0) return null;

    return (
      <Box key={title} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          {icon}
          <Typography variant="h6" color="text.primary">
            {title}
          </Typography>
          <Chip 
            label={steps.length} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Stack>

        <Stack spacing={1}>
          {steps.map((step, index) => (
            <Slide
              key={step.id}
              direction="right"
              in={true}
              timeout={300 + index * 100}
            >
              <AnimatedStepCard
                status={step.status}
                onClick={() => handleStepClick(step)}
                elevation={selectedStep === step.id ? 4 : 1}
              >
                {step.status === 'active' && <FlowIndicator />}
                
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ minWidth: 40 }}>
                    {getStepIcon(step.type, step.status)}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.primary">
                      {step.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Box>
                  
                  <Stack alignItems="flex-end" spacing={1}>
                    <Chip
                      label={step.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(step.status) as any}
                      variant={step.status === 'active' ? 'filled' : 'outlined'}
                    />
                    
                    {step.progress > 0 && (
                      <Box sx={{ width: 80 }}>
                        <ProgressBar 
                          variant="determinate" 
                          value={step.progress} 
                          progress={step.progress}
                        />
                      </Box>
                    )}
                  </Stack>
                </Stack>

                {/* Expanded Step Details */}
                <Collapse in={selectedStep === step.id}>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={2}>
                    {step.metadata.toolName && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Tool: {step.metadata.toolName}
                        </Typography>
                      </Box>
                    )}
                    
                    <Stack direction="row" spacing={4}>
                      {step.startTime && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Started: {step.startTime.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      )}
                      
                      {step.actualDuration && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Duration: {formatDuration(step.actualDuration)}
                          </Typography>
                        </Box>
                      )}
                      
                      {step.metadata.cost && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cost: ${step.metadata.cost.toFixed(4)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {step.metadata.errorMessage && (
                      <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <Typography variant="body2">
                          Error: {step.metadata.errorMessage}
                        </Typography>
                      </Paper>
                    )}
                  </Stack>
                </Collapse>
              </AnimatedStepCard>
            </Slide>
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <StyledWorkflowContainer>
      <CardContent>
        {/* Workflow Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <TrendingUp />
            </Avatar>
            <Box>
              <Typography variant="h6" color="text.primary">
                {workflow.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workflow.description}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            {interactive && (
              <>
                {workflow.status === 'executing' ? (
                  <Tooltip title="Pause Workflow">
                    <IconButton onClick={onPause} color="primary">
                      <Pause />
                    </IconButton>
                  </Tooltip>
                ) : workflow.status === 'paused' ? (
                  <Tooltip title="Resume Workflow">
                    <IconButton onClick={onResume} color="primary">
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                ) : null}
                
                <Tooltip title="Cancel Workflow">
                  <IconButton onClick={onCancel} color="error">
                    <Stop />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Stack>
        </Stack>

        {/* Overall Progress */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.primary">
              {progressMetrics.completed}/{progressMetrics.total} steps
            </Typography>
          </Stack>
          
          <ProgressBar 
            variant="determinate" 
            value={progressMetrics.overall} 
            progress={progressMetrics.overall}
          />
          
          {showMetrics && (
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Chip 
                label={`${workflow.metrics.totalCost.toFixed(4)} USD`} 
                size="small" 
                icon={<TrendingUp />}
                variant="outlined"
              />
              <Chip 
                label={`${workflow.metrics.totalTokens} tokens`} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={formatDuration(workflow.metrics.totalDuration)} 
                size="small" 
                variant="outlined"
              />
            </Stack>
          )}
        </Box>

        {/* Workflow Steps */}
        <Collapse in={expanded}>
          <Stack spacing={2}>
            {renderStepGroup(
              'Planning Phase',
              stepsByType.planning,
              <Psychology color="primary" />
            )}
            
            {renderStepGroup(
              'Tool Execution',
              stepsByType.tool_execution,
              <Build color="secondary" />
            )}
            
            {renderStepGroup(
              'Synthesis & Analysis',
              stepsByType.synthesis,
              <Analytics color="info" />
            )}
            
            {renderStepGroup(
              'Validation',
              stepsByType.validation,
              <CheckCircle color="success" />
            )}
            
            {renderStepGroup(
              'Agent Handoffs',
              stepsByType.handoff,
              <Share color="warning" />
            )}
          </Stack>
        </Collapse>
      </CardContent>
    </StyledWorkflowContainer>
  );
};

export default WorkflowVisualization;
