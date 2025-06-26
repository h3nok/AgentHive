import React from 'react';
import { 
  Badge, 
  Box, 
  LinearProgress, 
  Tooltip, 
  Typography,
  Chip,
  Stack
} from '@mui/material';
import { 
  Psychology,
  Pattern,
  SmartToy,
  Help,
  Speed,
  TrendingUp
} from '@mui/icons-material';
import { AgentType, RoutingMethod } from '../types/agent';
import { RoutingDecision } from '../services/routerSimulation';

interface RoutingStatusIndicatorProps {
  decision: RoutingDecision;
  isLoading?: boolean;
  showDetails?: boolean;
  variant?: 'compact' | 'detailed';
  className?: string;
}

const RoutingStatusIndicator: React.FC<RoutingStatusIndicatorProps> = ({
  decision,
  isLoading = false,
  showDetails = false,
  variant = 'compact',
  className
}) => {
  const getAgentColor = (agent: AgentType): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
    switch (agent) {
      case AgentType.LEASE: return 'primary';
      case AgentType.SALES: return 'success';
      case AgentType.SUPPORT: return 'warning';
      case AgentType.GENERAL: return 'info';
      case AgentType.CUSTOM: return 'secondary';
      default: return 'info';
    }
  };

  const getMethodIcon = (method: RoutingMethod) => {
    switch (method) {
      case RoutingMethod.LLM_ROUTER: return <Psychology fontSize="small" />;
      case RoutingMethod.ML_CLASSIFIER: return <SmartToy fontSize="small" />;
      case RoutingMethod.REGEX: return <Pattern fontSize="small" />;
      case RoutingMethod.FALLBACK: return <Help fontSize="small" />;
      default: return <Help fontSize="small" />;
    }
  };

  const getMethodName = (method: RoutingMethod): string => {
    switch (method) {
      case RoutingMethod.LLM_ROUTER: return 'LLM Router';
      case RoutingMethod.ML_CLASSIFIER: return 'ML Classifier';
      case RoutingMethod.REGEX: return 'Pattern Match';
      case RoutingMethod.FALLBACK: return 'Fallback';
      default: return 'Unknown';
    }
  };

  const getConfidenceColor = (confidence: number): 'success' | 'warning' | 'error' => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const formatLatency = (latency: number): string => {
    if (latency < 1000) return `${Math.round(latency)}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <Box className={className} sx={{ p: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Routing...
          </Typography>
          <LinearProgress sx={{ width: 60, height: 4 }} />
        </Stack>
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box className={className}>
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Routing Decision
              </Typography>
              <Typography variant="body2">
                Agent: <strong>{decision.selectedAgent}</strong>
              </Typography>
              <Typography variant="body2">
                Method: <strong>{getMethodName(decision.method)}</strong>
              </Typography>
              <Typography variant="body2">
                Confidence: <strong>{Math.round(decision.confidence * 100)}%</strong>
              </Typography>
              <Typography variant="body2">
                Latency: <strong>{formatLatency(decision.latency)}</strong>
              </Typography>
              {decision.reasoning && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {decision.reasoning}
                </Typography>
              )}
            </Box>
          }
          arrow
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip
              size="small"
              icon={getMethodIcon(decision.method)}
              label={decision.selectedAgent.toUpperCase()}
              color={getAgentColor(decision.selectedAgent)}
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
            <Badge
              badgeContent={`${Math.round(decision.confidence * 100)}%`}
              color={getConfidenceColor(decision.confidence)}
              sx={{ 
                '& .MuiBadge-badge': { 
                  fontSize: '0.6rem',
                  minWidth: '28px',
                  height: '16px'
                }
              }}
            >
              <Box sx={{ width: 8, height: 8 }} />
            </Badge>
          </Stack>
        </Tooltip>
      </Box>
    );
  }

  // Detailed variant
  return (
    <Box className={className} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="text.primary">
            Intelligent Routing Decision
          </Typography>
          <Chip
            size="small"
            icon={<Speed fontSize="small" />}
            label={formatLatency(decision.latency)}
            variant="outlined"
            color="info"
          />
        </Stack>

        {/* Agent and Method */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            icon={getMethodIcon(decision.method)}
            label={`${decision.selectedAgent.toUpperCase()} Agent`}
            color={getAgentColor(decision.selectedAgent)}
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="body2" color="text.secondary">
            via {getMethodName(decision.method)}
          </Typography>
        </Stack>

        {/* Confidence */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Confidence Score
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={`${getConfidenceColor(decision.confidence)}.main`}>
              {Math.round(decision.confidence * 100)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={decision.confidence * 100}
            color={getConfidenceColor(decision.confidence)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Intent */}
        <Stack direction="row" spacing={1} alignItems="center">
          <TrendingUp fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Intent: <strong>{decision.intent}</strong>
          </Typography>
        </Stack>

        {/* Reasoning */}
        {showDetails && decision.reasoning && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Reasoning:
            </Typography>
            <Typography 
              variant="body2" 
              color="text.primary"
              sx={{ 
                fontStyle: 'italic',
                p: 1,
                backgroundColor: 'action.hover',
                borderRadius: 1
              }}
            >
              {decision.reasoning}
            </Typography>
          </Box>
        )}

        {/* Metadata */}
        {showDetails && decision.metadata && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Metadata:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(decision.metadata).map(([key, value]) => (
                <Chip
                  key={key}
                  size="small"
                  label={`${key}: ${String(value)}`}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default RoutingStatusIndicator;
