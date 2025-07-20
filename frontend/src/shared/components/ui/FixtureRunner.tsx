import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  ExpandMore,
  ContentCopy,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  Code
} from '@mui/icons-material';
import { JSONSchemaViewer } from './JSONSchemaViewer';

/**
 * Fixture execution result interface
 */
export interface FixtureResult {
  id: string;
  timestamp: string;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  request: any;
  response?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Mock fixture interface
 */
export interface MockFixture {
  id: string;
  name: string;
  description: string;
  connectorId: string;
  port: string;
  method: string;
  requestSchema: any;
  responseSchema: any;
  sampleRequest: any;
  sampleResponse: any;
  timeout?: number;
}

/**
 * Props for the FixtureRunner component
 */
export interface FixtureRunnerProps {
  /** Available fixtures to run */
  fixtures: MockFixture[];
  /** Currently selected fixture ID */
  selectedFixtureId?: string;
  /** Callback when fixture is selected */
  onFixtureSelect?: (fixtureId: string) => void;
  /** Callback when fixture is executed */
  onExecuteFixture?: (fixture: MockFixture, request: any) => Promise<FixtureResult>;
  /** Whether the runner is currently executing */
  loading?: boolean;
  /** Recent execution results */
  results?: FixtureResult[];
  /** Maximum height of the component */
  maxHeight?: number;
}

/**
 * Result display component
 */
const ResultDisplay: React.FC<{ result: FixtureResult }> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (content: any) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: FixtureResult['status']) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'timeout': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: FixtureResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'timeout': return <Schedule color="warning" />;
      default: return null;
    }
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          {getStatusIcon(result.status)}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2">
              Execution {result.id.slice(-8)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(result.timestamp).toLocaleString()} • {result.duration}ms
            </Typography>
          </Box>
          <Chip 
            label={result.status} 
            size="small" 
            color={getStatusColor(result.status)}
            variant="outlined"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Request */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">Request</Typography>
              <IconButton size="small" onClick={() => handleCopy(result.request)}>
                {copied ? <CheckCircle color="success" /> : <ContentCopy />}
              </IconButton>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto' }}>
                {JSON.stringify(result.request, null, 2)}
              </pre>
            </Paper>
          </Box>

          {/* Response or Error */}
          {result.status === 'success' && result.response ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2">Response</Typography>
                <IconButton size="small" onClick={() => handleCopy(result.response)}>
                  <ContentCopy />
                </IconButton>
              </Box>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto' }}>
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </Paper>
            </Box>
          ) : result.error && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Error</Typography>
              <Alert severity="error">
                <Typography variant="body2">{result.error}</Typography>
              </Alert>
            </Box>
          )}

          {/* Metadata */}
          {result.metadata && Object.keys(result.metadata).length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Metadata</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                  {JSON.stringify(result.metadata, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * FixtureRunner component for executing mock data fixtures
 * 
 * @example
 * ```tsx
 * <FixtureRunner
 *   fixtures={mockFixtures}
 *   onExecuteFixture={handleExecuteFixture}
 *   results={executionResults}
 * />
 * ```
 */
export const FixtureRunner: React.FC<FixtureRunnerProps> = ({
  fixtures,
  selectedFixtureId,
  onFixtureSelect,
  onExecuteFixture,
  loading = false,
  results = [],
  maxHeight = 600
}) => {
  const [customRequest, setCustomRequest] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const selectedFixture = fixtures.find(f => f.id === selectedFixtureId);

  const handleFixtureChange = (fixtureId: string) => {
    if (onFixtureSelect) {
      onFixtureSelect(fixtureId);
    }
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (fixture) {
      setCustomRequest(fixture.sampleRequest);
    }
  };

  const handleExecute = useCallback(async () => {
    if (!selectedFixture || !onExecuteFixture) return;

    setExecuting(true);
    try {
      await onExecuteFixture(selectedFixture, customRequest || selectedFixture.sampleRequest);
    } catch (error) {
      console.error('Fixture execution failed:', error);
    } finally {
      setExecuting(false);
    }
  }, [selectedFixture, customRequest, onExecuteFixture]);

  const handleRequestChange = (newRequest: any) => {
    setCustomRequest(newRequest);
  };

  const handleReset = () => {
    if (selectedFixture) {
      setCustomRequest(selectedFixture.sampleRequest);
    }
  };

  const isExecuting = loading || executing;
  const recentResults = results.slice(0, 5); // Show last 5 results

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Mock Data Studio
        </Typography>
        
        {/* Fixture Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Fixture</InputLabel>
          <Select
            value={selectedFixtureId || ''}
            onChange={(e) => handleFixtureChange(e.target.value)}
            disabled={isExecuting}
          >
            {fixtures.map((fixture) => (
              <MenuItem key={fixture.id} value={fixture.id}>
                <Box>
                  <Typography variant="body2">{fixture.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fixture.connectorId} • {fixture.port} • {fixture.method}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Fixture Info */}
        {selectedFixture && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {selectedFixture.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={selectedFixture.connectorId} size="small" variant="outlined" />
              <Chip label={selectedFixture.port} size="small" variant="outlined" />
              <Chip label={selectedFixture.method} size="small" variant="outlined" />
              {selectedFixture.timeout && (
                <Chip 
                  label={`${selectedFixture.timeout}ms timeout`} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Box>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleExecute}
            disabled={!selectedFixture || isExecuting}
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReset}
            disabled={!selectedFixture || isExecuting}
          >
            Reset
          </Button>
          {isExecuting && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Stop />}
              disabled
            >
              Stop
            </Button>
          )}
        </Box>

        {isExecuting && (
          <LinearProgress sx={{ mt: 2 }} />
        )}
      </Paper>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, minHeight: 0 }}>
        {/* Request Editor */}
        {selectedFixture && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Request Editor
            </Typography>
            <JSONSchemaViewer
              schema={selectedFixture.requestSchema}
              sampleData={customRequest || selectedFixture.sampleRequest}
              editable
              onSampleDataChange={handleRequestChange}
              maxHeight={maxHeight - 200}
            />
          </Box>
        )}

        {/* Results Panel */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Execution Results
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              height: maxHeight - 200, 
              overflow: 'auto',
              p: recentResults.length === 0 ? 2 : 0
            }}
          >
            {recentResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Code sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No execution results yet. Run a fixture to see results here.
                </Typography>
              </Box>
            ) : (
              <Box>
                {recentResults.map((result) => (
                  <ResultDisplay key={result.id} result={result} />
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default FixtureRunner;
