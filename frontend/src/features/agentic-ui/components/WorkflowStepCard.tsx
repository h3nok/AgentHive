/**
 * Enhanced Workflow Step Card
 * 
 * Individual step visualization with advanced animations,
 * real-time progress, and interactive controls.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Stack,
  Avatar,
  Tooltip,
  Button,
  CircularProgress,
  Fade,
  Zoom,
  useTheme
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error,
  Schedule,
  Psychology,
  Build,
  Analytics,
  Lightbulb,
  Speed,
  Memory,
  AttachMoney
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { WorkflowStep } from '../types';

// Animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const thinkingAnimation = keyframes`
  0%, 20% { transform: rotate(0deg); }
  25% { transform: rotate(5deg); }
  75% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
`;

const progressGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 193, 7, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.6); }
  100% { box-shadow: 0 0 5px rgba(255, 193, 7, 0.3); }
`;

// Styled Components
const StepCard = styled(Card)<{ status: string; isActive?: boolean }>(({ theme, status, isActive }) => ({
  marginBottom: theme.spacing(2),
  border: `2px solid ${
    status === 'completed' ? theme.palette.success.main :
    status === 'active' ? theme.palette.warning.main :
    status === 'error' ? theme.palette.error.main :
    theme.palette.divider
  }`,
  background: isActive ? 
    `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 193, 7, 0.05) 100%)` :
    theme.palette.background.paper,
  transition: 'all 0.3s ease-in-out',
  animation: status === 'active' ? `${pulseAnimation} 2s infinite` : 'none',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  }
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const AnimatedProgress = styled(LinearProgress)<{ status: string }>(({ theme, status }) => ({
  height: 8,
  borderRadius: 4,
  animation: status === 'active' ? `${progressGlow} 2s infinite` : 'none',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: status === 'completed' ? 
      `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})` :
      `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
  }
}));

const ThinkingIcon = styled(Psychology)<{ isThinking?: boolean }>(({ theme, isThinking }) => ({
  animation: isThinking ? `${thinkingAnimation} 2s infinite` : 'none',
  color: theme.palette.primary.main,
}));

const MetricChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  fontSize: '0.7rem',
  height: 20,
}));

interface WorkflowStepCardProps {
  step: WorkflowStep;
  isActive?: boolean;
  onAction?: (action: 'pause' | 'resume' | 'cancel', stepId: string) => void;
  showMetrics?: boolean;
  interactive?: boolean;
}

const WorkflowStepCard: React.FC<WorkflowStepCardProps> = ({
  step,
  isActive = false,
  onAction,
  showMetrics = true,
  interactive = true
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(isActive);
  const [localProgress, setLocalProgress] = useState(step.progress);

  // Simulate real-time progress updates for active steps
  useEffect(() => {
    if (step.status === 'active' && step.progress < 100) {
      const interval = setInterval(() => {
        setLocalProgress(prev => {
          const increment = Math.random() * 5;
          const newProgress = Math.min(100, prev + increment);
          return newProgress;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setLocalProgress(step.progress);
    }
  }, [step.status, step.progress]);

  // Auto-expand active steps
  useEffect(() => {
    if (isActive) {
      setExpanded(true);
    }
  }, [isActive]);

  const getStepIcon = () => {
    switch (step.type) {
      case 'planning':
        return <ThinkingIcon isThinking={step.status === 'active'} />;
      case 'tool_execution':
        return <Build color={step.status === 'active' ? 'warning' : 'inherit'} />;
      case 'synthesis':
        return <Lightbulb color={step.status === 'active' ? 'warning' : 'inherit'} />;
      default:
        return <Analytics />;
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'active':
        return <CircularProgress size={20} color="warning" />;
      case 'error':
        return <Error color="error" />;
      case 'paused':
        return <Pause color="action" />;
      default:
        return <Schedule color="disabled" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(3)}`;
  };

  return (
    <Zoom in timeout={300}>
      <StepCard status={step.status} isActive={isActive}>
        <CardContent sx={{ pb: 1 }}>
          {/* Step Header */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
              {getStepIcon()}
            </Avatar>
            
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {step.name}
                </Typography>
                {getStatusIcon()}
              </Stack>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {step.description}
              </Typography>
            </Box>

            {interactive && (
              <Stack direction="row" spacing={0.5}>
                {step.status === 'active' && (
                  <Tooltip title="Pause step">
                    <IconButton
                      size="small"
                      onClick={() => onAction?.('pause', step.id)}
                    >
                      <Pause />
                    </IconButton>
                  </Tooltip>
                )}
                
                {step.status === 'paused' && (
                  <Tooltip title="Resume step">
                    <IconButton
                      size="small"
                      onClick={() => onAction?.('resume', step.id)}
                    >
                      <PlayArrow />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title={expanded ? "Collapse details" : "Expand details"}>
                  <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>

          {/* Progress Bar */}
          {(step.status === 'active' || step.status === 'completed') && (
            <ProgressContainer>
              <AnimatedProgress
                variant="determinate"
                value={localProgress}
                status={step.status}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ position: 'absolute', right: 0, top: -20 }}
              >
                {Math.round(localProgress)}%
              </Typography>
            </ProgressContainer>
          )}

          {/* Quick Metrics */}
          {showMetrics && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {step.metadata?.cost && (
                <MetricChip
                  icon={<AttachMoney />}
                  label={formatCost(step.metadata.cost)}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              )}
              
              {step.actualDuration && (
                <MetricChip
                  icon={<Speed />}
                  label={formatDuration(step.actualDuration)}
                  size="small"
                  variant="outlined"
                  color="success"
                />
              )}
              
              {step.metadata?.tokensUsed && (
                <MetricChip
                  icon={<Memory />}
                  label={`${step.metadata.tokensUsed} tokens`}
                  size="small"
                  variant="outlined"
                  color="warning"
                />
              )}
            </Stack>
          )}

          {/* Expanded Details */}
          <Collapse in={expanded} timeout={300}>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack spacing={2}>
                {/* Timing Information */}
                {(step.startTime || step.endTime) && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      TIMING
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                      {step.startTime && (
                        <Typography variant="body2">
                          Started: {step.startTime.toLocaleTimeString()}
                        </Typography>
                      )}
                      {step.endTime && (
                        <Typography variant="body2">
                          Ended: {step.endTime.toLocaleTimeString()}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Dependencies */}
                {step.dependencies && step.dependencies.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      DEPENDENCIES
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      {step.dependencies.map((depId) => (
                        <Chip
                          key={depId}
                          label={depId}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Tool Information */}
                {step.metadata?.toolName && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      TOOL
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {step.metadata.toolName}
                    </Typography>
                  </Box>
                )}

                {/* Agent Information */}
                {step.metadata?.agentId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      AGENT
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {step.metadata.agentId}
                    </Typography>
                  </Box>
                )}

                {/* Error Information */}
                {step.status === 'error' && step.error && (
                  <Box>
                    <Typography variant="caption" color="error" fontWeight="bold">
                      ERROR
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                      {step.error.message}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </StepCard>
    </Zoom>
  );
};

export default WorkflowStepCard;
