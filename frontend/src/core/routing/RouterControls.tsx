import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Popover,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useRouterSimulation } from '../hooks/useRouterSimulation';

interface RouterControlsProps {
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

/**
 * Router Controls - Compact controls for router simulation
 * Can be placed in the chat input area or toolbar
 */
const RouterControls: React.FC<RouterControlsProps> = ({
  onToggle,
  className
}) => {
  const { config, updateConfig, getPerformanceMetrics } = useRouterSimulation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    onToggle?.(enabled);
  };

  const open = Boolean(anchorEl);
  const metrics = getPerformanceMetrics();

  return (
    <Box className={className}>
      <Tooltip title={isEnabled ? "Router simulation enabled" : "Router simulation disabled"}>
        <IconButton
          onClick={handleClick}
          size="small"
          color={isEnabled ? "primary" : "default"}
          sx={{
            backgroundColor: isEnabled ? 'primary.light' : 'action.hover',
            '&:hover': {
              backgroundColor: isEnabled ? 'primary.main' : 'action.selected',
            }
          }}
        >
          <PsychologyIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Card sx={{ width: 300 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack spacing={2}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon color="primary" />
                <Typography variant="subtitle2">
                  Router Simulation
                </Typography>
              </Box>

              <Divider />

              {/* Enable/Disable */}
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={(e) => handleToggle(e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable Simulation"
              />

              {/* Quick Stats */}
              {isEnabled && metrics.totalDecisions > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Performance Overview
                  </Typography>
                  
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      size="small"
                      icon={<TrendingUpIcon fontSize="small" />}
                      label={`${metrics.totalDecisions} decisions`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      icon={<SpeedIcon fontSize="small" />}
                      label={`${Math.round(metrics.averageLatency)}ms avg`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`${Math.round(metrics.averageConfidence * 100)}% confidence`}
                      variant="outlined"
                      color={metrics.averageConfidence >= 0.8 ? 'success' : 
                             metrics.averageConfidence >= 0.6 ? 'warning' : 'error'}
                    />
                  </Stack>
                </Box>
              )}

              {/* Settings */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableLearningOptimization}
                      onChange={(e) => updateConfig({ enableLearningOptimization: e.target.checked })}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Learning Optimization
                    </Typography>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.simulateLatency}
                      onChange={(e) => updateConfig({ simulateLatency: e.target.checked })}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Simulate Latency
                    </Typography>
                  }
                />
              </Box>

              {/* Current Method */}
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Routing Method
                </Typography>
                <Chip
                  size="small"
                  label={config.preferredMethod === 'auto' ? 'Auto (Smart)' : config.preferredMethod}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Popover>
    </Box>
  );
};

export default RouterControls;
