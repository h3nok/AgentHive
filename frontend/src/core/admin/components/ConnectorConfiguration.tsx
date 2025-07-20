import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Settings,
  Save,
  RestartAlt,
  Delete,
  Visibility,
  VisibilityOff,
  Science,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Edit,
  Add,
  Remove,
  Security,
  Analytics,
  Notifications
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Types for Connector Configuration
interface ConnectorConfig {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  lastSync: string;
  settings: Record<string, any>;
  schema: ConfigSchema[];
  metrics: {
    requests: number;
    errors: number;
    uptime: number;
    lastRequest: string;
  };
}

interface ConfigSchema {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select' | 'url' | 'email';
  required: boolean;
  description?: string;
  options?: string[];
  validation?: string;
  sensitive?: boolean;
}

interface ConnectorConfigurationProps {
  connectorId?: string;
  onSave?: (config: ConnectorConfig) => void;
  onTest?: (connectorId: string) => void;
  onDelete?: (connectorId: string) => void;
}

// Mock data for installed connectors
const mockInstalledConnectors: ConnectorConfig[] = [
  {
    id: 'slack-connector',
    name: 'Slack Integration',
    version: '2.1.0',
    status: 'active',
    lastSync: '2025-01-19T18:30:00Z',
    settings: {
      api_token: 'xoxb-***-***-***',
      workspace_id: 'T1234567890',
      default_channel: '#general',
      enable_notifications: true,
      sync_frequency: 'real-time',
      message_format: 'markdown'
    },
    schema: [
      {
        key: 'api_token',
        label: 'Bot Token',
        type: 'password',
        required: true,
        description: 'Slack Bot User OAuth Token (starts with xoxb-)',
        sensitive: true
      },
      {
        key: 'workspace_id',
        label: 'Workspace ID',
        type: 'text',
        required: true,
        description: 'Your Slack workspace ID'
      },
      {
        key: 'default_channel',
        label: 'Default Channel',
        type: 'text',
        required: false,
        description: 'Default channel for notifications'
      },
      {
        key: 'enable_notifications',
        label: 'Enable Notifications',
        type: 'boolean',
        required: false,
        description: 'Send notifications to Slack'
      },
      {
        key: 'sync_frequency',
        label: 'Sync Frequency',
        type: 'select',
        required: false,
        options: ['real-time', 'hourly', 'daily'],
        description: 'How often to sync with Slack'
      },
      {
        key: 'message_format',
        label: 'Message Format',
        type: 'select',
        required: false,
        options: ['plain', 'markdown', 'rich'],
        description: 'Format for messages sent to Slack'
      }
    ],
    metrics: {
      requests: 1247,
      errors: 3,
      uptime: 99.8,
      lastRequest: '2025-01-19T18:25:00Z'
    }
  },
  {
    id: 'github-connector',
    name: 'GitHub Integration',
    version: '3.0.1',
    status: 'active',
    lastSync: '2025-01-19T18:20:00Z',
    settings: {
      access_token: 'ghp_***',
      organization: 'agenthive',
      repositories: ['core', 'frontend', 'docs'],
      webhook_url: 'https://api.agenthive.com/webhooks/github',
      enable_pr_notifications: true,
      auto_assign_reviewers: false
    },
    schema: [
      {
        key: 'access_token',
        label: 'Personal Access Token',
        type: 'password',
        required: true,
        description: 'GitHub Personal Access Token with repo permissions',
        sensitive: true
      },
      {
        key: 'organization',
        label: 'Organization',
        type: 'text',
        required: false,
        description: 'GitHub organization name (optional)'
      },
      {
        key: 'repositories',
        label: 'Repositories',
        type: 'text',
        required: false,
        description: 'Comma-separated list of repositories to monitor'
      },
      {
        key: 'webhook_url',
        label: 'Webhook URL',
        type: 'url',
        required: false,
        description: 'URL for GitHub webhooks'
      },
      {
        key: 'enable_pr_notifications',
        label: 'PR Notifications',
        type: 'boolean',
        required: false,
        description: 'Enable pull request notifications'
      },
      {
        key: 'auto_assign_reviewers',
        label: 'Auto-assign Reviewers',
        type: 'boolean',
        required: false,
        description: 'Automatically assign reviewers to PRs'
      }
    ],
    metrics: {
      requests: 892,
      errors: 1,
      uptime: 99.9,
      lastRequest: '2025-01-19T18:15:00Z'
    }
  }
];

const ConnectorConfiguration: React.FC<ConnectorConfigurationProps> = ({
  connectorId,
  onSave,
  onTest,
  onDelete
}) => {
  const theme = useTheme();
  const [selectedConnector, setSelectedConnector] = useState<ConnectorConfig | null>(
    connectorId ? mockInstalledConnectors.find(c => c.id === connectorId) || null : null
  );
  const [activeTab, setActiveTab] = useState(0);
  const [editedSettings, setEditedSettings] = useState<Record<string, any>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleConnectorSelect = useCallback((connector: ConnectorConfig) => {
    setSelectedConnector(connector);
    setEditedSettings(connector.settings);
    setHasChanges(false);
    setTestResult(null);
  }, []);

  const handleSettingChange = useCallback((key: string, value: any) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    if (selectedConnector) {
      const updatedConnector = {
        ...selectedConnector,
        settings: editedSettings,
        status: 'active' as const
      };
      onSave?.(updatedConnector);
      setHasChanges(false);
    }
  }, [selectedConnector, editedSettings, onSave]);

  const handleTest = useCallback(async () => {
    if (selectedConnector) {
      onTest?.(selectedConnector.id);
      // Simulate test result
      setTimeout(() => {
        setTestResult({
          success: Math.random() > 0.3,
          message: Math.random() > 0.3 ? 'Connection successful!' : 'Authentication failed. Please check your credentials.'
        });
      }, 2000);
    }
  }, [selectedConnector, onTest]);

  const handleDelete = useCallback(() => {
    if (selectedConnector) {
      onDelete?.(selectedConnector.id);
      setDeleteDialogOpen(false);
      setSelectedConnector(null);
    }
  }, [selectedConnector, onDelete]);

  const toggleSensitiveVisibility = useCallback((key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      case 'configuring': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'inactive': return <Info />;
      case 'error': return <Error />;
      case 'configuring': return <Warning />;
      default: return <Info />;
    }
  };

  const renderConfigField = (field: ConfigSchema) => {
    const value = editedSettings[field.key] ?? selectedConnector?.settings[field.key] ?? '';

    switch (field.type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => handleSettingChange(field.key, e.target.checked)}
              />
            }
            label={field.label}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'password':
        return (
          <TextField
            fullWidth
            label={field.label}
            type={showSensitive[field.key] ? 'text' : 'password'}
            value={field.sensitive && !showSensitive[field.key] ? '••••••••••••' : value}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            required={field.required}
            InputProps={{
              endAdornment: field.sensitive && (
                <IconButton onClick={() => toggleSensitiveVisibility(field.key)}>
                  {showSensitive[field.key] ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            type={field.type}
            value={value}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            required={field.required}
            multiline={field.type === 'text' && field.key.includes('description')}
            rows={field.type === 'text' && field.key.includes('description') ? 3 : 1}
          />
        );
    }
  };

  if (!selectedConnector && !connectorId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          Connector Configuration
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Select a connector to configure:
        </Typography>

        <Box 
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            },
            gap: 2
          }}
        >
          {mockInstalledConnectors.map((connector) => (
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: theme.shadows[4] }
                }}
                onClick={() => handleConnectorSelect(connector)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">{connector.name}</Typography>
                    <Chip
                      icon={getStatusIcon(connector.status)}
                      label={connector.status}
                      size="small"
                      color={getStatusColor(connector.status) as any}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Version {connector.version}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last sync: {new Date(connector.lastSync).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (!selectedConnector) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Connector not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
            {selectedConnector.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={getStatusIcon(selectedConnector.status)}
              label={selectedConnector.status}
              color={getStatusColor(selectedConnector.status) as any}
            />
            <Typography variant="body2" color="text.secondary">
              Version {selectedConnector.version}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Science />}
            onClick={handleTest}
            disabled={selectedConnector.status === 'configuring'}
          >
            Test Connection
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Uninstall
          </Button>
        </Box>
      </Box>

      {/* Test Result */}
      {testResult && (
        <Alert 
          severity={testResult.success ? 'success' : 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.message}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Settings />} label="Configuration" />
          <Tab icon={<Analytics />} label="Metrics" />
          <Tab icon={<Security />} label="Security" />
        </Tabs>
      </Box>

      {/* Configuration Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            {selectedConnector.schema.map((field) => (
              <Grid item xs={12} md={6} key={field.key}>
                <Box sx={{ mb: 2 }}>
                  {renderConfigField(field)}
                  {field.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {field.description}
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Save Button */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Configuration
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={() => {
                setEditedSettings(selectedConnector.settings);
                setHasChanges(false);
              }}
              disabled={!hasChanges}
            >
              Reset Changes
            </Button>
          </Box>
        </Box>
      )}

      {/* Metrics Tab */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {selectedConnector.metrics.requests.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="error">
                    {selectedConnector.metrics.errors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Errors
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success">
                    {selectedConnector.metrics.uptime}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body1">
                    {new Date(selectedConnector.metrics.lastRequest).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Request
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Performance</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Success Rate: {((selectedConnector.metrics.requests - selectedConnector.metrics.errors) / selectedConnector.metrics.requests * 100).toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(selectedConnector.metrics.requests - selectedConnector.metrics.errors) / selectedConnector.metrics.requests * 100}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Uptime: {selectedConnector.metrics.uptime}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={selectedConnector.metrics.uptime}
                  color="success"
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Security Tab */}
      {activeTab === 2 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Security settings and audit information for this connector.
          </Alert>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Authentication</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                This connector uses secure authentication methods and encrypted connections.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Encryption in Transit"
                    secondary="TLS 1.3 encryption for all API calls"
                  />
                  <ListItemSecondaryAction>
                    <CheckCircle color="success" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Token Storage"
                    secondary="Credentials encrypted at rest"
                  />
                  <ListItemSecondaryAction>
                    <CheckCircle color="success" />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Permissions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review the permissions granted to this connector.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Read Access"
                    secondary="Can read data from connected service"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Write Access"
                    secondary="Can send data to connected service"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Uninstall Connector</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to uninstall {selectedConnector.name}? 
            This will remove all configuration and stop all integrations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Uninstall
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectorConfiguration;
