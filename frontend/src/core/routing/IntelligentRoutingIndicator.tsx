import React from 'react';
import { Box, Chip, Tooltip, Typography, Paper } from '@mui/material';
import { SmartToy, Psychology, TrendingUp, AutoMode } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const IntelligentRoutingIndicator: React.FC = () => {
  const routingMetadata = useSelector((state: RootState) => state.chat.routingMetadata);

  if (!routingMetadata || !routingMetadata.routing_enabled) {
    return null;
  }

  const getAgentIcon = (agentType: string) => {
    switch (agentType.toLowerCase()) {
      case 'lease':
      case 'lease_agent':
        return <Psychology fontSize="small" />;
      case 'general':
      case 'general_agent':
        return <SmartToy fontSize="small" />;
      case 'analytics':
      case 'data_analyst':
        return <TrendingUp fontSize="small" />;
      default:
        return <AutoMode fontSize="small" />;
    }
  };

  const getAgentDisplayName = (agentType: string) => {
    switch (agentType.toLowerCase()) {
      case 'lease':
      case 'lease_agent':
        return 'Lease Agent';
      case 'general':
      case 'general_agent':
        return 'General Assistant';
      case 'analytics':
      case 'data_analyst':
        return 'Data Analyst';
      default:
        return agentType.charAt(0).toUpperCase() + agentType.slice(1);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'default';
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 1.5, 
        mb: 2, 
        backgroundColor: 'rgba(25, 118, 210, 0.06)',
        border: '1px solid rgba(25, 118, 210, 0.25)',
        borderRadius: 2,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(4px)',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Tooltip title="Intelligent routing automatically selected the best agent for your query">
          <Box display="flex" alignItems="center" gap={0.5}>
            <AutoMode fontSize="small" color="primary" />
            <Typography variant="caption" color="primary" fontWeight="medium">
              Smart Routing:
            </Typography>
          </Box>
        </Tooltip>

        <Chip
          icon={getAgentIcon(routingMetadata.selected_agent || '')}
          label={getAgentDisplayName(routingMetadata.selected_agent || '')}
          size="small"
          color="primary"
          variant="outlined"
        />

        {routingMetadata.confidence !== undefined && (
          <Tooltip title={`Routing confidence: ${formatConfidence(routingMetadata.confidence)}`}>
            <Chip
              label={formatConfidence(routingMetadata.confidence)}
              size="small"
              color={getConfidenceColor(routingMetadata.confidence)}
              variant="outlined"
            />
          </Tooltip>
        )}

        {routingMetadata.intent && (
          <Tooltip title={`Detected intent: ${routingMetadata.intent}`}>
            <Chip
              label={routingMetadata.intent}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Tooltip>
        )}

        {routingMetadata.routing_method && (
          <Tooltip title={`Routing method: ${routingMetadata.routing_method}`}>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              via {routingMetadata.routing_method}
            </Typography>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

export default IntelligentRoutingIndicator;
