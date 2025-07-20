import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Search,
  Timeline,
  CheckCircle,
  Error,
  Warning,
  AccessTime,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
  Refresh
} from '@mui/icons-material';

interface TraceStep {
  id: string;
  timestamp: string;
  port: string;
  adapter: string;
  operation: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  duration: number;
  request?: any;
  response?: any;
  error?: string;
}

interface Trace {
  id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  totalDuration: number;
  status: 'completed' | 'failed' | 'running';
  steps: TraceStep[];
  user: string;
  tenant: string;
}

const mockTraces: Trace[] = [
  {
    id: 'trace-001',
    sessionId: 'session-abc123',
    startTime: '2025-01-19T09:14:30Z',
    endTime: '2025-01-19T09:14:32Z',
    totalDuration: 2340,
    status: 'completed',
    user: 'john.doe@company.com',
    tenant: 'acme-corp',
    steps: [
      {
        id: 'step-1',
        timestamp: '2025-01-19T09:14:30.123Z',
        port: 'hr.employee.query',
        adapter: 'workday-hr',
        operation: 'GET /employees',
        status: 'success',
        duration: 156,
        request: { employeeId: 'EMP001', fields: ['name', 'department', 'salary'] },
        response: { name: 'John Smith', department: 'Engineering', salary: 95000 }
      },
      {
        id: 'step-2',
        timestamp: '2025-01-19T09:14:30.456Z',
        port: 'crm.lead.create',
        adapter: 'salesforce-crm',
        operation: 'POST /leads',
        status: 'success',
        duration: 892,
        request: { name: 'Jane Doe', company: 'Tech Corp', email: 'jane@techcorp.com' },
        response: { id: 'LEAD123', status: 'created' }
      },
      {
        id: 'step-3',
        timestamp: '2025-01-19T09:14:31.789Z',
        port: 'itsm.incident.create',
        adapter: 'servicenow-itsm',
        operation: 'POST /incidents',
        status: 'error',
        duration: 1292,
        request: { title: 'System outage', priority: 'high', assignee: 'support-team' },
        error: 'Authentication failed: Invalid API key'
      }
    ]
  },
  {
    id: 'trace-002',
    sessionId: 'session-def456',
    startTime: '2025-01-19T09:12:15Z',
    endTime: '2025-01-19T09:12:18Z',
    totalDuration: 3120,
    status: 'failed',
    user: 'sarah.wilson@company.com',
    tenant: 'acme-corp',
    steps: [
      {
        id: 'step-1',
        timestamp: '2025-01-19T09:12:15.234Z',
        port: 'hr.payroll.get',
        adapter: 'workday-hr',
        operation: 'GET /payroll',
        status: 'warning',
        duration: 2340,
        request: { employeeId: 'EMP002', period: '2025-01' },
        response: { warning: 'Partial data returned', amount: 4500 }
      },
      {
        id: 'step-2',
        timestamp: '2025-01-19T09:12:17.890Z',
        port: 'finance.budget.update',
        adapter: 'sap-erp',
        operation: 'PUT /budget',
        status: 'error',
        duration: 780,
        request: { department: 'Engineering', amount: 50000 },
        error: 'Timeout: Request exceeded 5000ms limit'
      }
    ]
  }
];

const TraceExplorer: React.FC = () => {
  const [traces] = useState<Trace[]>(mockTraces);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': case 'completed': return 'success';
      case 'warning': return 'warning';
      case 'error': case 'failed': return 'error';
      case 'pending': case 'running': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': case 'completed': return <CheckCircle color="success" fontSize="small" />;
      case 'warning': return <Warning color="warning" fontSize="small" />;
      case 'error': case 'failed': return <Error color="error" fontSize="small" />;
      case 'pending': case 'running': return <AccessTime color="info" fontSize="small" />;
      default: return null;
    }
  };

  const filteredTraces = traces.filter(trace => 
    trace.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trace.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trace.steps.some(step => 
      step.port.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.adapter.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Trace Explorer
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Debug tool call flows and performance bottlenecks
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />}>
          Refresh
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search traces by ID, user, port, or adapter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Trace List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredTraces.map((trace) => (
          <Card key={trace.id}>
            <CardContent>
              {/* Trace Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getStatusIcon(trace.status)}
                  <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                    {trace.id}
                  </Typography>
                  <Chip 
                    label={trace.status} 
                    size="small" 
                    color={getStatusColor(trace.status)}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {formatDuration(trace.totalDuration)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatTimestamp(trace.startTime)}
                  </Typography>
                </Box>
              </Box>

              {/* Trace Metadata */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={`User: ${trace.user}`} size="small" variant="outlined" />
                <Chip label={`Tenant: ${trace.tenant}`} size="small" variant="outlined" />
                <Chip label={`Session: ${trace.sessionId}`} size="small" variant="outlined" />
                <Chip label={`${trace.steps.length} steps`} size="small" variant="outlined" />
              </Box>

              {/* Timeline Progress */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Execution Timeline</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {trace.steps.filter(s => s.status === 'success').length}/{trace.steps.length} successful
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(trace.steps.filter(s => s.status === 'success').length / trace.steps.length) * 100}
                  color={trace.status === 'completed' ? 'success' : trace.status === 'failed' ? 'error' : 'warning'}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Steps */}
              <Typography variant="subtitle1" gutterBottom>
                Execution Steps
              </Typography>
              
              {trace.steps.map((step, index) => (
                <Accordion key={step.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      {getStatusIcon(step.status)}
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 200 }}>
                        {step.port}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ minWidth: 120 }}>
                        {step.adapter}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ minWidth: 100 }}>
                        {formatDuration(step.duration)}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(step.timestamp)}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle2">
                        Operation: {step.operation}
                      </Typography>
                      
                      {step.request && (
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Request:
                          </Typography>
                          <Box sx={{ 
                            bgcolor: 'grey.100', 
                            p: 1, 
                            borderRadius: 1, 
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            overflow: 'auto'
                          }}>
                            {JSON.stringify(step.request, null, 2)}
                          </Box>
                        </Box>
                      )}

                      {step.response && (
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Response:
                          </Typography>
                          <Box sx={{ 
                            bgcolor: 'success.50', 
                            p: 1, 
                            borderRadius: 1, 
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            overflow: 'auto'
                          }}>
                            {JSON.stringify(step.response, null, 2)}
                          </Box>
                        </Box>
                      )}

                      {step.error && (
                        <Alert severity="error">
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {step.error}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        ))}
      </Box>

      {filteredTraces.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Timeline sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No traces found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Try adjusting your search criteria or check if there are any active tool calls.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TraceExplorer;
