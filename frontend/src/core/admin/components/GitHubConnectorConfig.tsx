import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Settings,
  Save,
  Delete,
  Visibility,
  VisibilityOff,
  Science,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  GitHub,
  Code,
  BugReport,
  MergeType,
  Business,
  Notifications,
  Api,
  ArrowBack
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import githubConnectorApi, { GitHubConfig as ApiGitHubConfig } from '../../../services/githubConnectorApi';

interface GitHubConfig {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'error' | 'configuring' | 'discovering';
  lastSync: string;
  settings: {
    access_token: string;
    base_url: string;
    organization?: string;
    repositories: string[];
    webhook_url?: string;
    enable_pr_notifications: boolean;
    enable_issue_notifications: boolean;
    auto_assign_reviewers: boolean;
    default_branch: string;
    sync_frequency: string;
    rate_limit_buffer: number;
  };
  discoveredApis?: ApiEndpoint[];
  capabilities?: string[];
  userInfo?: any;
  organizationInfo?: any;
  metrics: {
    requests: number;
    errors: number;
    uptime: number;
    lastRequest: string;
    rateLimitRemaining: number;
    rateLimitLimit: number;
  };
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  category: string;
  enabled?: boolean;
}

interface GitHubConnectorConfigProps {
  connectorId?: string;
  onSave?: (config: GitHubConfig) => void;
  onTest?: (connectorId: string) => void;
  onDelete?: (connectorId: string) => void;
  onBack?: () => void;
}

const GitHubConnectorConfig: React.FC<GitHubConnectorConfigProps> = ({
  connectorId,
  onSave,
  onTest,
  onDelete,
  onBack
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<GitHubConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  // Q&A state
  const [qaOwner, setQaOwner] = useState('');
  const [qaRepo, setQaRepo] = useState('');
  const [qaCommits, setQaCommits] = useState<any[] | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

  // Mock GitHub configuration data
  const mockGitHubConfig: GitHubConfig = {
    id: 'github-enterprise',
    name: 'GitHub Enterprise',
    version: '3.0.1',
    status: 'active',
    lastSync: '2025-01-19T18:20:00Z',
    settings: {
      access_token: 'ghp_xxxxxxxxxxxxxxxxxxxx',
      base_url: 'https://api.github.com',
      organization: 'agenthive',
      repositories: ['core', 'frontend', 'docs', 'connectors'],
      webhook_url: 'https://api.agenthive.com/webhooks/github',
      enable_pr_notifications: true,
      enable_issue_notifications: true,
      auto_assign_reviewers: false,
      default_branch: 'main',
      sync_frequency: 'real-time',
      rate_limit_buffer: 500
    },
    discoveredApis: [
      { method: 'GET', path: '/user', description: 'Get authenticated user', category: 'user', enabled: true },
      { method: 'GET', path: '/user/repos', description: 'List user repositories', category: 'repositories', enabled: true },
      { method: 'GET', path: '/orgs/{org}/repos', description: 'List organization repositories', category: 'repositories', enabled: true },
      { method: 'GET', path: '/repos/{owner}/{repo}/issues', description: 'List repository issues', category: 'issues', enabled: true },
      { method: 'POST', path: '/repos/{owner}/{repo}/issues', description: 'Create repository issue', category: 'issues', enabled: true },
      { method: 'GET', path: '/repos/{owner}/{repo}/pulls', description: 'List pull requests', category: 'pull_requests', enabled: true },
      { method: 'POST', path: '/repos/{owner}/{repo}/pulls', description: 'Create pull request', category: 'pull_requests', enabled: true },
      { method: 'POST', path: '/repos/{owner}/{repo}/hooks', description: 'Create webhook', category: 'webhooks', enabled: true }
    ],
    capabilities: ['repository_management', 'issue_tracking', 'pull_request_management', 'organization_management', 'webhook_support'],
    userInfo: {
      login: 'agenthive-bot',
      name: 'AgentHive Bot',
      email: 'bot@agenthive.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
      public_repos: 15,
      followers: 42,
      following: 12
    },
    organizationInfo: {
      login: 'agenthive',
      name: 'AgentHive Inc.',
      description: 'Universal Employee Copilot Platform',
      public_repos: 8,
      followers: 156,
      following: 23
    },
    metrics: {
      requests: 2847,
      errors: 5,
      uptime: 99.8,
      lastRequest: '2025-01-19T18:15:00Z',
      rateLimitRemaining: 4847,
      rateLimitLimit: 5000
    }
  };

  useEffect(() => {
    setConfig(mockGitHubConfig);
  }, [connectorId]);

  const handleAutoDiscover = useCallback(async () => {
    if (!config) return;
    
    setDiscovering(true);
    setConfig(prev => prev ? { ...prev, status: 'discovering' } : null);
    
    try {
      // Convert internal config to API format
      const apiConfig: ApiGitHubConfig = {
        access_token: config.settings.access_token,
        base_url: config.settings.base_url,
        organization: config.settings.organization,
        repositories: config.settings.repositories,
        webhook_url: config.settings.webhook_url,
        enable_pr_notifications: config.settings.enable_pr_notifications,
        enable_issue_notifications: config.settings.enable_issue_notifications,
        auto_assign_reviewers: config.settings.auto_assign_reviewers,
        default_branch: config.settings.default_branch,
        sync_frequency: config.settings.sync_frequency,
        rate_limit_buffer: config.settings.rate_limit_buffer
      };

      // Call real GitHub API discovery via backend
      const response = await githubConnectorApi.discoverApis(apiConfig);
      
      if (response.status === 'success') {
        setConfig(prev => prev ? {
          ...prev,
          status: 'active',
          discoveredApis: response.apis,
          capabilities: response.capabilities
        } : null);
      } else {
        console.error('API discovery failed:', response.error);
        setConfig(prev => prev ? { ...prev, status: 'error' } : null);
      }
      
    } catch (error) {
      console.error('GitHub API discovery error:', error);
      setConfig(prev => prev ? { ...prev, status: 'error' } : null);
    } finally {
      setDiscovering(false);
    }
  }, [config]);

  const handleTestConnection = useCallback(async () => {
    if (!config) return;
    
    setLoading(true);
    try {
      // Convert internal config to API format
      const apiConfig: ApiGitHubConfig = {
        access_token: config.settings.access_token,
        base_url: config.settings.base_url,
        organization: config.settings.organization,
        repositories: config.settings.repositories,
        webhook_url: config.settings.webhook_url,
        enable_pr_notifications: config.settings.enable_pr_notifications,
        enable_issue_notifications: config.settings.enable_issue_notifications,
        auto_assign_reviewers: config.settings.auto_assign_reviewers,
        default_branch: config.settings.default_branch,
        sync_frequency: config.settings.sync_frequency,
        rate_limit_buffer: config.settings.rate_limit_buffer
      };

      // Call real GitHub API via backend
      const response = await githubConnectorApi.testConnection(apiConfig);
      
      if (response.status === 'success') {
        setTestResults({
          status: 'success',
          message: response.message,
          user: response.user?.login,
          organization: response.organization?.login,
          rateLimitRemaining: response.rate_limit?.remaining,
          permissions: response.permissions || []
        });
        
        // Update config with real user and org data
        setConfig(prev => prev ? {
          ...prev,
          userInfo: response.user,
          organizationInfo: response.organization,
          metrics: {
            ...prev.metrics,
            rateLimitRemaining: response.rate_limit?.remaining || prev.metrics.rateLimitRemaining,
            rateLimitLimit: response.rate_limit?.limit || prev.metrics.rateLimitLimit
          }
        } : null);
      } else {
        setTestResults({
          status: 'error',
          message: response.message,
          error: response.error || 'Connection test failed'
        });
      }
    } catch (error) {
      console.error('GitHub connection test error:', error);
      setTestResults({
        status: 'error',
        message: 'Connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  }, [config]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'error': return 'error';
      case 'configuring': case 'discovering': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'configuring': case 'discovering': return <CircularProgress size={20} />;
      default: return <Warning color="warning" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user': return <Business />;
      case 'repositories': return <Code />;
      case 'issues': return <BugReport />;
      case 'pull_requests': return <MergeType />;
      case 'organization': return <Business />;
      case 'webhooks': return <Notifications />;
      case 'meta': return <Api />;
      default: return <Settings />;
    }
  };

  if (!config) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <GitHub sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {config.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={getStatusIcon(config.status)}
                label={config.status.charAt(0).toUpperCase() + config.status.slice(1)}
                color={getStatusColor(config.status) as any}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                Version {config.version} • Last sync: {new Date(config.lastSync).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {onBack && (
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={onBack}>
              Back to Marketplace
            </Button>
          )}
          <Button variant="contained" startIcon={<Save />} onClick={() => onSave?.(config)}>
            Save Configuration
          </Button>
          <Button variant="outlined" startIcon={<Science />} onClick={handleTestConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            variant="outlined"
            startIcon={discovering ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleAutoDiscover}
            disabled={discovering}
          >
            {discovering ? 'Discovering...' : 'Auto-Discover APIs'}
          </Button>
        </Box>
      </Box>

      {/* Test Results */}
      {testResults && (
        <Alert 
          severity={testResults.status === 'success' ? 'success' : 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setTestResults(null)}
        >
          <Typography variant="subtitle2">{testResults.message}</Typography>
          {testResults.status === 'success' && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                User: {testResults.user} | Organization: {testResults.organization} | 
                Rate Limit: {testResults.rateLimitRemaining}/5000
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Configuration" />
        <Tab label="API Discovery" />
        <Tab label="Metrics" />
        <Tab label="Q&A" />
      </Tabs>

      {/* Configuration Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Authentication</Typography>
                
                <TextField
                  fullWidth
                  label="Personal Access Token"
                  type={showToken ? 'text' : 'password'}
                  value={config.settings.access_token}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    settings: { ...prev.settings, access_token: e.target.value }
                  } : null)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => setShowToken(!showToken)}>
                        {showToken ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="GitHub API Base URL"
                  value={config.settings.base_url}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    settings: { ...prev.settings, base_url: e.target.value }
                  } : null)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Organization (Optional)"
                  value={config.settings.organization || ''}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    settings: { ...prev.settings, organization: e.target.value }
                  } : null)}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Repository Settings</Typography>
                
                <TextField
                  fullWidth
                  label="Repositories (comma-separated)"
                  value={config.settings.repositories.join(', ')}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    settings: { ...prev.settings, repositories: e.target.value.split(',').map(r => r.trim()) }
                  } : null)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Default Branch"
                  value={config.settings.default_branch}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    settings: { ...prev.settings, default_branch: e.target.value }
                  } : null)}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth>
                  <InputLabel>Sync Frequency</InputLabel>
                  <Select
                    value={config.settings.sync_frequency}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      settings: { ...prev.settings, sync_frequency: e.target.value }
                    } : null)}
                  >
                    <MenuItem value="real-time">Real-time</MenuItem>
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Notification Settings</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.settings.enable_pr_notifications}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            settings: { ...prev.settings, enable_pr_notifications: e.target.checked }
                          } : null)}
                        />
                      }
                      label="PR Notifications"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.settings.enable_issue_notifications}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            settings: { ...prev.settings, enable_issue_notifications: e.target.checked }
                          } : null)}
                        />
                      }
                      label="Issue Notifications"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.settings.auto_assign_reviewers}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            settings: { ...prev.settings, auto_assign_reviewers: e.target.checked }
                          } : null)}
                        />
                      }
                      label="Auto-assign Reviewers"
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={config.settings.webhook_url || ''}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    settings: { ...prev.settings, webhook_url: e.target.value }
                  } : null)}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* API Discovery Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Discovered API Endpoints</Typography>
            <Button
              variant="outlined"
              startIcon={discovering ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleAutoDiscover}
              disabled={discovering}
            >
              {discovering ? 'Discovering...' : 'Refresh Discovery'}
            </Button>
          </Box>

          {config.discoveredApis && config.discoveredApis.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Method</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {config.discoveredApis.map((api, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip 
                          label={api.method} 
                          size="small" 
                          color={api.method === 'GET' ? 'primary' : api.method === 'POST' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{api.path}</TableCell>
                      <TableCell>{api.description}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getCategoryIcon(api.category)}
                          <Typography variant="body2">{api.category}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={api.enabled ? 'Enabled' : 'Disabled'} 
                          size="small" 
                          color={api.enabled ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No API endpoints discovered yet. Click "Auto-Discover APIs" to scan available endpoints.
            </Alert>
          )}

          {config.capabilities && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Connector Capabilities</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {config.capabilities.map((capability) => (
                  <Chip 
                    key={capability} 
                    label={capability.replace('_', ' ')} 
                    variant="outlined" 
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Q&A Tab */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Query Recent Commits</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField label="Owner" fullWidth value={qaOwner} onChange={(e) => setQaOwner(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Repository" fullWidth value={qaRepo} onChange={(e) => setQaRepo(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button variant="contained" disabled={qaLoading || !qaOwner || !qaRepo} onClick={async () => {
                if (!config) return;
                setQaLoading(true);
                try {
                  const data = await githubConnectorApi.getCommits({
                    owner: qaOwner,
                    repo: qaRepo,
                    limit: 20,
                    token: config.settings.access_token,
                    base_url: config.settings.base_url,
                    organization: config.settings.organization,
                    mock_mode: true
                  });
                  if (data.status === 'success') {
                    setQaCommits(data.commits);
                  } else {
                    setQaCommits([]);
                  }
                } catch (err) {
                  console.error(err);
                  setQaCommits([]);
                } finally {
                  setQaLoading(false);
                }
              }}>Fetch Commits</Button>
            </Grid>
          </Grid>
          {qaLoading && <CircularProgress />}
          {qaCommits && qaCommits.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SHA</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qaCommits.map((c) => (
                    <TableRow key={c.sha}>
                      <TableCell>{c.sha.substring(0, 7)}</TableCell>
                      <TableCell>{c.message}</TableCell>
                      <TableCell>{c.author}</TableCell>
                      <TableCell>{new Date(c.date).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {qaCommits && qaCommits.length === 0 && !qaLoading && (
            <Alert severity="info">No commits found or error occurred.</Alert>
          )}
        </Box>
      )}

      {/* Metrics Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Performance Metrics</Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests: {config.metrics.requests.toLocaleString()}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(config.metrics.requests / 5000 * 100, 100)}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate: {((config.metrics.requests - config.metrics.errors) / config.metrics.requests * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(config.metrics.requests - config.metrics.errors) / config.metrics.requests * 100}
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Uptime: {config.metrics.uptime}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={config.metrics.uptime}
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Rate Limiting</Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Rate Limit: {config.metrics.rateLimitRemaining} / {config.metrics.rateLimitLimit}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={config.metrics.rateLimitRemaining / config.metrics.rateLimitLimit * 100}
                    color={config.metrics.rateLimitRemaining < 1000 ? 'warning' : 'success'}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Last Request: {new Date(config.metrics.lastRequest).toLocaleString()}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Errors: {config.metrics.errors}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default GitHubConnectorConfig;
