import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Slider,
  Chip,
  Alert,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  Psychology as PsychologyIcon,
  Pattern as PatternIcon,
  SmartToy as SmartToyIcon,
  Help as HelpIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useRouterSimulation } from '../hooks/useRouterSimulation';
import { RoutingMethod } from '../types/agent';
import RoutingStatusIndicator from './RoutingStatusIndicator';

interface RouterSimulationPanelProps {
  className?: string;
}

const RouterSimulationPanel: React.FC<RouterSimulationPanelProps> = ({ className }) => {
  const {
    simulateRouting,
    isSimulating,
    lastDecision,
    error,
    config,
    updateConfig,
    clearHistory,
    getPerformanceMetrics,
  } = useRouterSimulation();

  const [testQuery, setTestQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(getPerformanceMetrics());

  const handleSimulate = async () => {
    if (!testQuery.trim()) return;
    
    try {
      await simulateRouting(testQuery);
      setPerformanceMetrics(getPerformanceMetrics());
    } catch (err) {
      console.error('Simulation failed:', err);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setPerformanceMetrics(getPerformanceMetrics());
  };

  const getMethodIcon = (method: RoutingMethod | string) => {
    switch (method) {
      case RoutingMethod.LLM_ROUTER:
      case 'llm_router':
        return <PsychologyIcon fontSize="small" />;
      case RoutingMethod.ML_CLASSIFIER:
      case 'ml_classifier':
        return <SmartToyIcon fontSize="small" />;
      case RoutingMethod.REGEX:
      case 'regex':
        return <PatternIcon fontSize="small" />;
      case RoutingMethod.FALLBACK:
      case 'fallback':
        return <HelpIcon fontSize="small" />;
      default:
        return <HelpIcon fontSize="small" />;
    }
  };

  return (
    <Box className={className} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PsychologyIcon />
        Router Simulation
      </Typography>

      {/* Test Query Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Test Query"
          placeholder="Enter a query to test routing..."
          value={testQuery}
          onChange={(e) => setTestQuery(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 2 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSimulate();
            }
          }}
        />
        
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={handleSimulate}
            disabled={isSimulating || !testQuery.trim()}
            sx={{ flexGrow: 1 }}
          >
            {isSimulating ? 'Simulating...' : 'Simulate Routing'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setShowSettings(!showSettings)}
            size="small"
          >
            Settings
          </Button>
        </Stack>
      </Box>

      {/* Settings Panel */}
      {showSettings && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Simulation Configuration
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Preferred Method</InputLabel>
                  <Select
                    value={config.preferredMethod}
                    onChange={(e) => updateConfig({ preferredMethod: e.target.value as RoutingMethod | 'auto' })}
                    label="Preferred Method"
                  >
                    <MenuItem value="auto">Auto (Smart Selection)</MenuItem>
                    <MenuItem value={RoutingMethod.LLM_ROUTER}>LLM Router</MenuItem>
                    <MenuItem value={RoutingMethod.ML_CLASSIFIER}>ML Classifier</MenuItem>
                    <MenuItem value={RoutingMethod.REGEX}>Pattern Matching</MenuItem>
                    <MenuItem value={RoutingMethod.FALLBACK}>Fallback</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box>
                <Typography variant="body2" gutterBottom>
                  Confidence Threshold: {Math.round(config.confidenceThreshold * 100)}%
                </Typography>
                <Slider
                  value={config.confidenceThreshold}
                  onChange={(event: Event, value: number | number[]) => updateConfig({ confidenceThreshold: value as number })}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  size="small"
                />
              </Box>
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableLearningOptimization}
                      onChange={(e) => updateConfig({ enableLearningOptimization: e.target.checked })}
                    />
                  }
                  label="Learning Optimization"
                />
              </Box>
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.simulateLatency}
                      onChange={(e) => updateConfig({ simulateLatency: e.target.checked })}
                    />
                  }
                  label="Simulate Latency"
                />
              </Box>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Error Rate: {config.errorRate}%
              </Typography>
              <Slider
                value={config.errorRate}
                onChange={(event: Event, value: number | number[]) => updateConfig({ errorRate: value as number })}
                min={0}
                max={20}
                step={1}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Last Decision */}
      {lastDecision && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Latest Routing Decision
          </Typography>
          <RoutingStatusIndicator
            decision={lastDecision}
            variant="detailed"
            showDetails
          />
        </Box>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              Performance Metrics
            </Typography>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearHistory}
              color="secondary"
            >
              Clear History
            </Button>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {performanceMetrics.totalDecisions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Decisions
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {Math.round(performanceMetrics.averageConfidence * 100)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Confidence
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {Math.round(performanceMetrics.averageLatency)}ms
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Latency
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {Object.keys(performanceMetrics.agentPerformance).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Agents
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Method Distribution */}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Method Distribution
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {Object.entries(performanceMetrics.methodDistribution).map(([method, count]) => (
              count > 0 && (
                <Chip
                  key={method}
                  icon={getMethodIcon(method)}
                  label={`${method}: ${count}`}
                  size="small"
                  variant="outlined"
                />
              )
            ))}
          </Stack>

          {/* Agent Performance */}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Agent Performance
          </Typography>
          <Stack spacing={1}>
            {Object.entries(performanceMetrics.agentPerformance).map(([agent, metrics]) => (
              metrics.requests > 0 && (
                <Box key={agent} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={agent.toUpperCase()}
                    size="small"
                    color="primary"
                    sx={{ minWidth: 80 }}
                  />
                  <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, fontSize: '0.875rem' }}>
                    <span>{metrics.requests} requests</span>
                    <span>{Math.round(metrics.avgConfidence * 100)}% confidence</span>
                    <span>{Math.round(metrics.avgLatency)}ms latency</span>
                  </Box>
                </Box>
              )
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RouterSimulationPanel;
