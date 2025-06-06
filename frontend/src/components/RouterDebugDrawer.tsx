import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  Tooltip,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { useRouterTrace } from '../hooks/useRouterTrace';
import { RouterTrace, RouterStep } from '../features/routerTrace/routerTraceSlice';
import RouterSimulationPanel from './RouterSimulationPanel';

interface RouterDebugDrawerProps {
  sessionId?: string;
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 450;

// Agent colors for consistent visualization
const AGENT_COLORS = {
  lease: '#2196F3',
  sales: '#4CAF50', 
  support: '#FF9800',
  general: '#9C27B0',
} as const;

// Method colors
const METHOD_COLORS = {
  llm_router: '#4CAF50',
  regex: '#2196F3',
  fallback: '#FF9800',
} as const;

const RouterDebugDrawer: React.FC<RouterDebugDrawerProps> = ({
  sessionId,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const {
    traces,
    activeTrace,
    stats,
    isConnected,
    isConnecting,
    error,
    filters,
    settings,
    setActiveTrace,
    clearTraces,
    updateFilters,
    updateSettings,
  } = useRouterTrace(sessionId);

  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Memoized filtered traces for performance
  const displayTraces = useMemo(() => {
    return traces.slice(0, 50); // Limit displayed traces for performance
  }, [traces]);

  const handleTraceClick = (traceId: string) => {
    setActiveTrace(traceId);
    setExpandedTrace(expandedTrace === traceId ? null : traceId);
  };

  const formatLatency = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.palette.success.main;
    if (confidence >= 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const renderTraceStep = (step: RouterStep, index: number) => (
    <Box
      key={step.id}
      sx={{
        p: 1,
        mb: 1,
        borderRadius: 1,
        backgroundColor: alpha(METHOD_COLORS[step.method] || theme.palette.grey[500], 0.1),
        border: `1px solid ${alpha(METHOD_COLORS[step.method] || theme.palette.grey[500], 0.3)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, mr: 1 }}>
          Step {index + 1}
        </Typography>
        <Chip
          size="small"
          label={step.method}
          sx={{
            backgroundColor: METHOD_COLORS[step.method] || theme.palette.grey[500],
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {formatLatency(step.latency_ms)}
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <strong>Agent:</strong> {step.agent}
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <strong>Intent:</strong> {step.intent}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 1 }}>
          <strong>Confidence:</strong>
        </Typography>
        <Chip
          size="small"
          label={`${(step.confidence * 100).toFixed(1)}%`}
          sx={{
            backgroundColor: getConfidenceColor(step.confidence),
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      </Box>
    </Box>
  );

  const renderTrace = (trace: RouterTrace) => {
    const isExpanded = expandedTrace === trace.id;
    const isActive = activeTrace?.id === trace.id;
    
    return (
      <Accordion
        key={trace.id}
        expanded={isExpanded}
        onChange={() => handleTraceClick(trace.id)}
        sx={{
          mb: 1,
          border: isActive ? `2px solid ${theme.palette.primary.main}` : '1px solid',
          borderColor: isActive ? theme.palette.primary.main : theme.palette.divider,
          '&:before': { display: 'none' },
          borderRadius: 1,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {trace.success ? (
                <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1, fontSize: 16 }} />
              ) : (
                <ErrorIcon sx={{ color: theme.palette.error.main, mr: 1, fontSize: 16 }} />
              )}
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                {trace.query.substring(0, 40)}{trace.query.length > 40 ? '...' : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatLatency(trace.totalLatency)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={trace.finalAgent}
                  sx={{
                    backgroundColor: AGENT_COLORS[trace.finalAgent as keyof typeof AGENT_COLORS] || theme.palette.grey[500],
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
                <Chip
                  size="small"
                  label={`${(trace.finalConfidence * 100).toFixed(1)}%`}
                  sx={{
                    backgroundColor: getConfidenceColor(trace.finalConfidence),
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {new Date(trace.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ mr: 1, fontSize: 16 }} />
              Routing Steps ({trace.steps.length})
            </Typography>
            
            {trace.steps.map((step, index) => renderTraceStep(step, index))}
            
            {trace.error && (
              <Box
                sx={{
                  p: 2,
                  mt: 2,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                }}
              >
                <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                  Error Details
                </Typography>
                <Typography variant="body2" color="error">
                  {trace.error}
                </Typography>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderStats = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <SpeedIcon sx={{ mr: 1, fontSize: 16 }} />
        Performance Stats
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {stats.totalTraces}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Traces
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {formatLatency(stats.avgLatency)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Avg Latency
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {stats.avgConfidence.toFixed(1)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Avg Confidence
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {stats.successRate.toFixed(1)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Success Rate
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  const renderFilters = () => (
    <Collapse in={showFilters}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Filters
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Agent</InputLabel>
          <Select
            value={filters.agent || ''}
            label="Agent"
            onChange={(e) => updateFilters({ agent: e.target.value || null })}
          >
            <MenuItem value="">All Agents</MenuItem>
            <MenuItem value="lease">Lease</MenuItem>
            <MenuItem value="sales">Sales</MenuItem>
            <MenuItem value="support">Support</MenuItem>
            <MenuItem value="general">General</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Method</InputLabel>
          <Select
            value={filters.method || ''}
            label="Method"
            onChange={(e) => updateFilters({ method: e.target.value || null })}
          >
            <MenuItem value="">All Methods</MenuItem>
            <MenuItem value="llm_router">LLM Router</MenuItem>
            <MenuItem value="regex">Regex</MenuItem>
            <MenuItem value="fallback">Fallback</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          size="small"
          label="Min Confidence (%)"
          type="number"
          value={filters.minConfidence * 100}
          onChange={(e) => updateFilters({ minConfidence: Number(e.target.value) / 100 })}
          sx={{ mb: 2 }}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={filters.showErrors}
              onChange={(e) => updateFilters({ showErrors: e.target.checked })}
            />
          }
          label="Show Errors"
        />
      </Paper>
    </Collapse>
  );

  const renderSettings = () => (
    <Collapse in={showSettings}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Settings
        </Typography>
        
        <TextField
          fullWidth
          size="small"
          label="Max Traces"
          type="number"
          value={settings.maxTraces}
          onChange={(e) => updateSettings({ maxTraces: Number(e.target.value) })}
          sx={{ mb: 2 }}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoScroll}
              onChange={(e) => updateSettings({ autoScroll: e.target.checked })}
            />
          }
          label="Auto Scroll to Latest"
          sx={{ mb: 1 }}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.enableLiveUpdates}
              onChange={(e) => updateSettings({ enableLiveUpdates: e.target.checked })}
            />
          }
          label="Live Updates"
        />
      </Paper>
    </Collapse>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <PsychologyIcon sx={{ mr: 1 }} />
            Router Debug
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Connection Status">
              <Badge
                color={isConnected ? 'success' : error ? 'error' : 'warning'}
                variant="dot"
                sx={{ mr: 1 }}
              >
                <AccessTimeIcon fontSize="small" />
              </Badge>
            </Tooltip>
            
            <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
              <FilterIcon />
            </IconButton>
            
            <IconButton size="small" onClick={() => setShowSettings(!showSettings)}>
              <SettingsIcon />
            </IconButton>
            
            <IconButton size="small" onClick={clearTraces}>
              <RefreshIcon />
            </IconButton>
            
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {isConnecting ? 'Connecting...' : 
           isConnected ? `Connected to session ${sessionId}` :
           error ? `Error: ${error}` :
           'Disconnected'}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e: React.SyntheticEvent, newValue: number) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Traces" />
          <Tab label="Simulation" />
        </Tabs>
        
        {activeTab === 0 && (
          <>
            {renderStats()}
            {renderFilters()}
            {renderSettings()}
            
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ mr: 1, fontSize: 16 }} />
              Recent Traces ({displayTraces.length})
            </Typography>
            
            {displayTraces.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No router traces yet. Send a message to see routing decisions.
                </Typography>
              </Box>
            ) : (
              <Box>
                {displayTraces.map(renderTrace)}
              </Box>
            )}
          </>
        )}
        
        {activeTab === 1 && (
          <RouterSimulationPanel />
        )}
      </Box>
    </Drawer>
  );
};

export default RouterDebugDrawer;
