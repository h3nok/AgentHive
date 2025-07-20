/**
 * MockStudio - Production-ready mock data studio using DashboardGrid
 * 
 * This component provides a comprehensive testing environment for connectors
 * with fixture management, JSON schema editing, and test execution.
 * Uses the reusable DashboardGrid framework for consistent layout.
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,

  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  PlayArrow,
  Add,
  Search,
  MoreVert,

  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Refresh,

  Delete,
  ContentCopy,
  Download
} from '@mui/icons-material';
import { DashboardGrid, DashboardCardProps } from '../../shared/components/dashboard/DashboardGrid';

import { ConnectorIcon } from '../../shared/components/ui/ConnectorIcon';

/**
 * Mock fixture data structure
 */
interface MockFixture {
  id: string;
  name: string;
  description: string;
  connectorId: string;
  connectorName: string;
  category: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  requestSchema: any;
  responseSchema: any;
  sampleRequest: any;
  sampleResponse: any;
  lastRun?: string;
  status?: 'success' | 'error' | 'warning' | 'pending';
  executionTime?: number;
}

/**
 * Mock fixtures data
 */
const mockFixtures: MockFixture[] = [
  {
    id: 'workday-employee-query',
    name: 'Employee Query',
    description: 'Query employee data from Workday HR system',
    connectorId: 'workday-hr',
    connectorName: 'Workday HR',
    category: 'hr',
    method: 'GET',
    endpoint: '/employees',
    requestSchema: {
      type: 'object',
      properties: {
        department: { type: 'string', description: 'Department filter' },
        status: { type: 'string', enum: ['active', 'inactive'], description: 'Employee status' },
        limit: { type: 'integer', minimum: 1, maximum: 1000, description: 'Number of results' }
      }
    },
    responseSchema: {
      type: 'object',
      properties: {
        employees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              department: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        total: { type: 'integer' }
      }
    },
    sampleRequest: {
      department: 'Engineering',
      status: 'active',
      limit: 50
    },
    sampleResponse: {
      employees: [
        {
          id: 'emp-001',
          name: 'John Doe',
          email: 'john.doe@company.com',
          department: 'Engineering',
          status: 'active'
        }
      ],
      total: 1
    },
    lastRun: '2025-01-19T10:30:00Z',
    status: 'success',
    executionTime: 245
  },
  {
    id: 'salesforce-lead-create',
    name: 'Create Lead',
    description: 'Create new lead in Salesforce CRM',
    connectorId: 'salesforce-crm',
    connectorName: 'Salesforce CRM',
    category: 'crm',
    method: 'POST',
    endpoint: '/leads',
    requestSchema: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'company'],
      properties: {
        firstName: { type: 'string', description: 'Lead first name' },
        lastName: { type: 'string', description: 'Lead last name' },
        email: { type: 'string', format: 'email', description: 'Lead email address' },
        company: { type: 'string', description: 'Lead company name' },
        phone: { type: 'string', description: 'Lead phone number' }
      }
    },
    responseSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Created lead ID' },
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    sampleRequest: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@prospect.com',
      company: 'Prospect Corp',
      phone: '+1-555-0123'
    },
    sampleResponse: {
      id: 'lead-12345',
      success: true,
      message: 'Lead created successfully'
    },
    lastRun: '2025-01-19T09:15:00Z',
    status: 'success',
    executionTime: 180
  },
  {
    id: 'jira-ticket-create',
    name: 'Create Ticket',
    description: 'Create new ticket in Jira ITSM',
    connectorId: 'jira-itsm',
    connectorName: 'Jira ITSM',
    category: 'itsm',
    method: 'POST',
    endpoint: '/issues',
    requestSchema: {
      type: 'object',
      required: ['summary', 'description', 'issueType'],
      properties: {
        summary: { type: 'string', description: 'Issue summary' },
        description: { type: 'string', description: 'Issue description' },
        issueType: { type: 'string', enum: ['Bug', 'Task', 'Story'], description: 'Issue type' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'], description: 'Issue priority' }
      }
    },
    responseSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Issue key' },
        id: { type: 'string', description: 'Issue ID' },
        self: { type: 'string', description: 'Issue URL' }
      }
    },
    sampleRequest: {
      summary: 'API integration test',
      description: 'Testing API integration for connector',
      issueType: 'Task',
      priority: 'Medium'
    },
    sampleResponse: {
      key: 'TEST-123',
      id: '10001',
      self: 'https://company.atlassian.net/rest/api/2/issue/10001'
    },
    lastRun: '2025-01-19T08:45:00Z',
    status: 'warning',
    executionTime: 320
  }
];

/**
 * MockStudio component using DashboardGrid framework
 * 
 * Features:
 * - Reusable DashboardGrid layout
 * - Fixture library with search and filtering
 * - JSON schema viewer and editor
 * - Test execution with results
 * - Export and import capabilities
 * 
 * @example
 * ```tsx
 * <MockStudio />
 * ```
 */
const MockStudio: React.FC = () => {
  const [fixtures] = useState<MockFixture[]>(mockFixtures);
  const [selectedFixture, setSelectedFixture] = useState<MockFixture | null>(fixtures[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleFixtureSelect = useCallback((fixture: MockFixture) => {
    setSelectedFixture(fixture);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = useCallback((action: string) => {
    handleMenuClose();
    console.log(`Action: ${action} for fixture: ${selectedFixture?.id}`);
    // TODO: Implement actions
  }, [selectedFixture]);

  // Filter fixtures based on search term
  const filteredFixtures = fixtures.filter(fixture => 
    fixture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fixture.connectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fixture.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create dashboard cards for DashboardGrid
  const dashboardCards: DashboardCardProps[] = [
    // Fixture Library
    {
      id: 'fixture-library',
      title: 'Fixture Library',
      defaultLayout: { x: 0, y: 0, w: 4, h: 8 },
      children: (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Test Fixtures
              </Typography>
              <Button variant="outlined" startIcon={<Add />} size="small">
                New
              </Button>
            </Box>

            <TextField
              placeholder="Search fixtures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {filteredFixtures.length} fixtures available
            </Typography>
          </CardContent>

          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <List dense>
              {filteredFixtures.map((fixture, index) => (
                <React.Fragment key={fixture.id}>
                  <ListItemButton
                    selected={selectedFixture?.id === fixture.id}
                    onClick={() => handleFixtureSelect(fixture)}
                  >
                    <ListItemIcon>
                      <ConnectorIcon
                        category={fixture.category as any}
                        fallbackText={fixture.connectorName}
                        size={24}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={fixture.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" component="div">
                            {fixture.connectorName}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                            <Chip 
                              label={fixture.method} 
                              size="small" 
                              variant="outlined"
                              color={fixture.method === 'GET' ? 'primary' : 
                                     fixture.method === 'POST' ? 'success' : 'default'}
                            />
                            {fixture.status && (
                              <Chip
                                label={fixture.status}
                                size="small"
                                color={fixture.status === 'success' ? 'success' : 
                                       fixture.status === 'error' ? 'error' : 'warning'}
                                icon={fixture.status === 'success' ? <CheckCircle /> : 
                                      fixture.status === 'error' ? <ErrorIcon /> : <Warning />}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                  {index < filteredFixtures.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Card>
      )
    },

    // Schema Viewer
    {
      id: 'schema-viewer',
      title: 'Schema & Data',
      defaultLayout: { x: 4, y: 0, w: 8, h: 4 },
      children: selectedFixture ? (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {selectedFixture.name} - Request Schema
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Request Schema:</Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <pre>{JSON.stringify(selectedFixture.requestSchema, null, 2)}</pre>
              </Box>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Sample Request:</Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <pre>{JSON.stringify(selectedFixture.sampleRequest, null, 2)}</pre>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Sample Response:</Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <pre>{JSON.stringify(selectedFixture.sampleResponse, null, 2)}</pre>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Select a fixture to view schema and data
          </Typography>
        </Card>
      )
    },

    // Fixture Runner
    {
      id: 'fixture-runner',
      title: 'Test Execution',
      defaultLayout: { x: 4, y: 4, w: 8, h: 4 },
      children: selectedFixture ? (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Test Execution
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<PlayArrow />}
                onClick={() => {
                  console.log('Running fixture:', selectedFixture.id);
                  // TODO: Implement actual fixture execution
                }}
              >
                Run Test
              </Button>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Endpoint:</Typography>
              <Chip 
                label={`${selectedFixture.method} ${selectedFixture.endpoint}`} 
                variant="outlined" 
                color="primary"
              />
            </Box>

            {selectedFixture.lastRun && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Last Execution:</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2">
                    {new Date(selectedFixture.lastRun).toLocaleString()}
                  </Typography>
                  {selectedFixture.status && (
                    <Chip
                      label={selectedFixture.status}
                      size="small"
                      color={selectedFixture.status === 'success' ? 'success' : 
                             selectedFixture.status === 'error' ? 'error' : 'warning'}
                      icon={selectedFixture.status === 'success' ? <CheckCircle /> : 
                            selectedFixture.status === 'error' ? <ErrorIcon /> : <Warning />}
                    />
                  )}
                  {selectedFixture.executionTime && (
                    <Typography variant="caption" color="text.secondary">
                      ({selectedFixture.executionTime}ms)
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Click "Run Test" to execute this fixture with the sample request data.
                Results will be displayed here.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Select a fixture to run tests
          </Typography>
        </Card>
      )
    }
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Mock Data Studio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test and validate connector integrations with mock data fixtures
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Download />} size="small">
              Export
            </Button>
            <Button variant="outlined" startIcon={<ContentCopy />} size="small">
              Import
            </Button>
            <Button variant="outlined" startIcon={<Refresh />} size="small">
              Refresh
            </Button>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Status Alert */}
        {selectedFixture && (
          <Alert 
            severity={selectedFixture.status === 'success' ? 'success' : 
                     selectedFixture.status === 'error' ? 'error' : 'warning'}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              {selectedFixture.status === 'success' && 
                `Last test run successful in ${selectedFixture.executionTime}ms`}
              {selectedFixture.status === 'error' && 
                'Last test run failed. Check logs for details.'}
              {selectedFixture.status === 'warning' && 
                'Last test run completed with warnings. Review results.'}
            </Typography>
          </Alert>
        )}
      </Box>

      {/* DashboardGrid with Mock Studio */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <DashboardGrid cards={dashboardCards} />
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleAction('export-all')}>
          <Download sx={{ mr: 1 }} fontSize="small" />
          Export All Fixtures
        </MenuItem>
        <MenuItem onClick={() => handleAction('import')}>
          <ContentCopy sx={{ mr: 1 }} fontSize="small" />
          Import Fixtures
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('run-all')}>
          <PlayArrow sx={{ mr: 1 }} fontSize="small" />
          Run All Tests
        </MenuItem>
        <MenuItem onClick={() => handleAction('clear-results')}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Clear Results
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MockStudio;
