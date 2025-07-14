import React, { useState, useEffect } from 'react';
import { 
  Box,
  Chip,
  Fade,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  Stack,
  Badge
} from '@mui/material';
import {
  Psychology,
  Pattern,
  SmartToy,
  Help,
  Visibility,
  VisibilityOff,
  TrendingUp
} from '@mui/icons-material';
import { useRouterSimulation } from '../hooks/useRouterSimulation';
import { AgentType, RoutingMethod } from '../types/agent';
import RoutingStatusIndicator from './RoutingStatusIndicator';

interface ChatRoutingIndicatorProps {
  message: string;
  onRoutingDecision?: (decision: any) => void;
  showInline?: boolean;
  autoSimulate?: boolean;
  className?: string;
}

/**
 * Chat Routing Indicator - Shows routing decisions in real-time during chat
 * Provides visual feedback for intelligent routing with confidence indicators
 */
const ChatRoutingIndicator: React.FC<ChatRoutingIndicatorProps> = ({
  message,
  onRoutingDecision,
  showInline = true,
  autoSimulate = true,
  className
}) => {
  const {
    simulateRouting,
    isSimulating,
    lastDecision,
    error,
  } = useRouterSimulation();

  const [isVisible, setIsVisible] = useState(showInline);
  const [simulationTriggered, setSimulationTriggered] = useState(false);

  // Auto-simulate routing when message changes
  useEffect(() => {
    if (autoSimulate && message.trim() && !simulationTriggered) {
      setSimulationTriggered(true);
      simulateRouting(message)
        .then((decision) => {
          onRoutingDecision?.(decision);
        })
        .catch((err) => {
          console.error('Routing simulation failed:', err);
        });
    }
  }, [message, autoSimulate, simulationTriggered, simulateRouting, onRoutingDecision]);

  // Reset simulation state when message changes
  useEffect(() => {
    setSimulationTriggered(false);
  }, [message]);

  const getAgentColor = (agent: AgentType): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
    switch (agent) {
      case AgentType.HR: return 'primary';
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

  const handleManualSimulation = async () => {
    if (!message.trim() || isSimulating) return;
    
    try {
      const decision = await simulateRouting(message);
      onRoutingDecision?.(decision);
    } catch (err) {
      console.error('Manual routing simulation failed:', err);
    }
  };

  if (!isVisible && !isSimulating && !lastDecision) {
    return null;
  }

  return (
    <Box className={className} sx={{ mb: 1 }}>
      <Fade in={isVisible || isSimulating || !!lastDecision}>
        <Box>
          {/* Header with toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TrendingUp fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Intelligent Routing
              </Typography>
              {isSimulating && (
                <CircularProgress size={12} sx={{ ml: 1 }} />
              )}
            </Stack>
            
            <Stack direction="row" spacing={0.5}>
              {!autoSimulate && (
                <Tooltip title="Simulate Routing">
                  <IconButton
                    size="small"
                    onClick={handleManualSimulation}
                    disabled={isSimulating || !message.trim()}
                  >
                    <Psychology fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title={isVisible ? "Hide Routing Info" : "Show Routing Info"}>
                <IconButton
                  size="small"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Routing Status */}
          {isVisible && (
            <Box>
              {isSimulating && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  backgroundColor: 'action.hover',
                  borderRadius: 1
                }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Analyzing query and selecting optimal agent...
                  </Typography>
                </Box>
              )}

              {error && (
                <Box sx={{ 
                  p: 1,
                  backgroundColor: 'error.light',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'error.main'
                }}>
                  <Typography variant="body2" color="error.dark">
                    Routing Error: {error}
                  </Typography>
                </Box>
              )}

              {lastDecision && !isSimulating && (
                <RoutingStatusIndicator
                  decision={lastDecision}
                  variant="compact"
                />
              )}

              {/* Quick Agent Preview */}
              {lastDecision && (
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Selected Agent:
                    </Typography>
                    <Badge
                      badgeContent={`${Math.round(lastDecision.confidence * 100)}%`}
                      color={lastDecision.confidence >= 0.8 ? 'success' : 
                             lastDecision.confidence >= 0.6 ? 'warning' : 'error'}
                    >
                      <Chip
                        size="small"
                        icon={getMethodIcon(lastDecision.method)}
                        label={`${lastDecision.selectedAgent.toUpperCase()} Agent`}
                        color={getAgentColor(lastDecision.selectedAgent)}
                        variant={lastDecision.confidence >= 0.7 ? 'filled' : 'outlined'}
                      />
                    </Badge>
                  </Stack>
                  
                  {lastDecision.reasoning && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'block',
                        mt: 0.5,
                        fontStyle: 'italic'
                      }}
                    >
                      {lastDecision.reasoning}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

export default ChatRoutingIndicator;
