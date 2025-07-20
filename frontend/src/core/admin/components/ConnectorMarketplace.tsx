import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Rating,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Divider
} from '@mui/material';
import {
  Search,
  FilterList,
  GetApp,
  Settings,
  Info,
  Verified,
  Business,
  Code,
  Analytics,
  Storage,
  Chat,
  Close,
  CheckCircle,
  Security
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Types for Connector Marketplace
interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
}

interface Connector {
  id: string;
  name: string;
  description: string;
  category: string;
  vendor: string;
  version: string;
  pricing: 'free' | 'paid' | 'freemium';
  price?: number;
  rating: number;
  downloads: number;
  verified: boolean;
  featured: boolean;
  icon: string;
  screenshots: string[];
  tags: string[];
  lastUpdated: string;
  compatibility: string[];
  size?: string;
  documentation?: string;
  support?: string;
  installed: boolean;
  configurable: boolean;
  // Enterprise fields
  permissions?: string[];
  supportUrl?: string;
  apiEndpoints?: ApiEndpoint[];
  authMethods?: string[];
  compliance?: string[];
  enterpriseFeatures?: string[];
}

interface ConnectorMarketplaceProps {
  onInstallConnector?: (connectorId: string) => void;
  onConfigureConnector?: (connectorId: string) => void;
  onUninstallConnector?: (connectorId: string) => void;
}

// Mock data for connectors - Enterprise-grade examples
const mockConnectors: Connector[] = [
  {
    id: 'servicenow-enterprise',
    name: 'ServiceNow Enterprise',
    description: 'Complete ITSM integration with incident management, change requests, knowledge base, and workflow automation. Supports ITSM, HRSD, CSM, and custom applications.',
    category: 'Enterprise',
    vendor: 'ServiceNow Inc.',
    version: '3.2.1',
    pricing: 'paid',
    price: 0,
    rating: 4.9,
    downloads: 8420,
    verified: true,
    featured: true,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/servicenow/servicenow-original.svg',
    screenshots: [],
    tags: ['itsm', 'incident-management', 'workflow', 'enterprise', 'api'],
    lastUpdated: '2024-01-20',
    compatibility: ['AgentHive Enterprise 1.0+'],
    permissions: ['incidents:read', 'incidents:write', 'change:read', 'change:write', 'knowledge:read', 'users:read'],
    supportUrl: 'https://support.servicenow.com',
    documentation: 'https://docs.servicenow.com/api',
    apiEndpoints: [
      { method: 'GET', path: '/api/now/table/incident', description: 'Retrieve incidents' },
      { method: 'POST', path: '/api/now/table/incident', description: 'Create incident' },
      { method: 'GET', path: '/api/now/table/change_request', description: 'Retrieve change requests' },
      { method: 'POST', path: '/api/now/table/change_request', description: 'Create change request' }
    ],
    authMethods: ['OAuth 2.0', 'Basic Auth', 'API Key'],
    compliance: ['SOC 2', 'GDPR', 'HIPAA', 'ISO 27001'],
    enterpriseFeatures: ['Multi-tenant', 'RBAC', 'Audit Logging', 'Custom Fields'],
    installed: false,
    configurable: true
  },
  {
    id: 'jira-enterprise',
    name: 'Jira Enterprise',
    description: 'Advanced project management and issue tracking with custom workflows, automation rules, and enterprise security. Supports Jira Software, Service Management, and Work Management.',
    category: 'Development',
    vendor: 'Atlassian',
    version: '4.1.3',
    pricing: 'paid',
    price: 0,
    rating: 4.7,
    downloads: 12350,
    verified: true,
    featured: true,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg',
    screenshots: [],
    tags: ['project-management', 'issue-tracking', 'agile', 'enterprise', 'api'],
    lastUpdated: '2024-01-18',
    compatibility: ['AgentHive Enterprise 1.0+'],
    permissions: ['issues:read', 'issues:write', 'projects:read', 'users:read', 'workflows:read'],
    supportUrl: 'https://support.atlassian.com',
    documentation: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    apiEndpoints: [
      { method: 'GET', path: '/rest/api/3/issue/{issueIdOrKey}', description: 'Get issue details' },
      { method: 'POST', path: '/rest/api/3/issue', description: 'Create issue' },
      { method: 'GET', path: '/rest/api/3/project', description: 'Get all projects' },
      { method: 'POST', path: '/rest/api/3/issue/{issueIdOrKey}/transitions', description: 'Transition issue' }
    ],
    authMethods: ['OAuth 2.0', 'API Token', 'Personal Access Token'],
    compliance: ['SOC 2', 'GDPR', 'ISO 27001'],
    enterpriseFeatures: ['Advanced Workflows', 'Custom Fields', 'Automation Rules', 'Enterprise Security'],
    installed: false,
    configurable: true
  },
  {
    id: 'slack-connector',
    name: 'Slack Integration',
    description: 'Connect your AgentHive workflows with Slack channels, direct messages, and notifications.',
    category: 'Communication',
    vendor: 'Slack Technologies',
    version: '2.1.0',
    pricing: 'free',
    rating: 4.8,
    downloads: 15420,
    verified: true,
    featured: false,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',
    screenshots: [],
    tags: ['messaging', 'notifications', 'team-collaboration'],
    lastUpdated: '2025-01-15',
    compatibility: ['agentive-v2.x', 'agentive-v3.x'],
    size: '2.4 MB',
    documentation: 'https://docs.agenthive.com/connectors/slack',
    support: 'https://support.slack.com',
    installed: true,
    configurable: true
  },
  {
    id: 'salesforce-connector',
    name: 'Salesforce CRM',
    description: 'Integrate with Salesforce to manage leads, contacts, opportunities, and automate CRM workflows.',
    category: 'CRM',
    vendor: 'Salesforce Inc.',
    version: '1.8.2',
    pricing: 'freemium',
    price: 29.99,
    rating: 4.6,
    downloads: 8930,
    verified: true,
    featured: true,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg',
    screenshots: [],
    tags: ['crm', 'sales', 'automation', 'enterprise'],
    lastUpdated: '2025-01-10',
    compatibility: ['agentive-v2.x'],
    size: '5.1 MB',
    documentation: 'https://docs.agenthive.com/connectors/salesforce',
    support: 'https://help.salesforce.com',
    installed: false,
    configurable: true
  },
  {
    id: 'github-enterprise',
    name: 'GitHub Enterprise',
    description: 'Connect to your GitHub organization repositories, automate issue creation, pull request management, and CI/CD workflows. Supports GitHub.com and GitHub Enterprise Server.',
    category: 'Development',
    vendor: 'GitHub Inc.',
    version: '4.2.1',
    pricing: 'free',
    price: 0,
    rating: 4.9,
    downloads: 12650,
    verified: true,
    featured: true,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
    screenshots: [],
    tags: ['git', 'repositories', 'ci-cd', 'development', 'enterprise'],
    lastUpdated: '2024-01-22',
    compatibility: ['AgentHive 1.0+'],
    permissions: ['repo', 'issues:write', 'pull_requests:write', 'actions:read', 'metadata:read'],
    supportUrl: 'https://support.github.com',
    documentation: 'https://docs.github.com/en/rest',
    apiEndpoints: [
      { method: 'GET', path: '/repos/{owner}/{repo}/issues', description: 'List repository issues' },
      { method: 'POST', path: '/repos/{owner}/{repo}/issues', description: 'Create new issue' },
      { method: 'GET', path: '/repos/{owner}/{repo}/pulls', description: 'List pull requests' },
      { method: 'POST', path: '/repos/{owner}/{repo}/pulls', description: 'Create pull request' },
      { method: 'GET', path: '/repos/{owner}/{repo}/actions/runs', description: 'List workflow runs' },
      { method: 'POST', path: '/repos/{owner}/{repo}/dispatches', description: 'Trigger workflow' }
    ],
    authMethods: ['Personal Access Token', 'GitHub App', 'OAuth 2.0'],
    compliance: ['SOC 2', 'GDPR'],
    enterpriseFeatures: ['Organization Management', 'Team Permissions', 'Audit Logging', 'SAML SSO'],
    installed: false,
    configurable: true
  },
  {
    id: 'google-analytics-connector',
    name: 'Google Analytics',
    description: 'Access Google Analytics data, create reports, and automate marketing insights.',
    category: 'Analytics',
    vendor: 'Google LLC',
    version: '2.3.0',
    pricing: 'free',
    rating: 4.4,
    downloads: 6780,
    verified: true,
    featured: false,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
    screenshots: [],
    tags: ['analytics', 'reporting', 'marketing', 'data'],
    lastUpdated: '2025-01-12',
    compatibility: ['agentive-v2.x'],
    size: '4.7 MB',
    documentation: 'https://docs.agenthive.com/connectors/google-analytics',
    support: 'https://support.google.com/analytics',
    installed: false,
    configurable: true
  },
  {
    id: 'notion-connector',
    name: 'Notion Workspace',
    description: 'Integrate with Notion pages, databases, and automate knowledge management workflows.',
    category: 'Productivity',
    vendor: 'Notion Labs',
    version: '1.5.3',
    pricing: 'paid',
    price: 19.99,
    rating: 4.7,
    downloads: 4320,
    verified: true,
    featured: false,
    icon: 'https://www.notion.so/images/logo-ios.png',
    screenshots: [],
    tags: ['productivity', 'knowledge-base', 'automation'],
    lastUpdated: '2025-01-08',
    compatibility: ['agentive-v2.x', 'agentive-v3.x'],
    size: '1.8 MB',
    documentation: 'https://docs.agenthive.com/connectors/notion',
    support: 'https://www.notion.so/help',
    installed: false,
    configurable: true
  },
  {
    id: 'aws-s3-storage',
    name: 'AWS S3 Storage',
    description: 'Connect to Amazon S3 buckets for file storage, backup, and data processing workflows.',
    category: 'Storage',
    vendor: 'Amazon Web Services',
    version: '2.0.0',
    pricing: 'free',
    price: 0,
    rating: 4.5,
    downloads: 9870,
    verified: true,
    featured: false,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg',
    screenshots: [],
    tags: ['storage', 'cloud', 'backup', 'aws'],
    lastUpdated: '2025-01-14',
    compatibility: ['AgentHive 1.0+'],
    documentation: 'https://docs.aws.amazon.com/s3/latest/API/',
    supportUrl: 'https://aws.amazon.com/support',
    installed: false,
    configurable: true
  }
];

const categories = [
  { value: 'all', label: 'All Categories', icon: <FilterList /> },
  { value: 'Enterprise', label: 'Enterprise', icon: <Business /> },
  { value: 'Communication', label: 'Communication', icon: <Chat /> },
  { value: 'CRM', label: 'CRM', icon: <Business /> },
  { value: 'Development', label: 'Development', icon: <Code /> },
  { value: 'Analytics', label: 'Analytics', icon: <Analytics /> },
  { value: 'Productivity', label: 'Productivity', icon: <Settings /> },
  { value: 'Storage', label: 'Storage', icon: <Storage /> }
];

const ConnectorMarketplace: React.FC<ConnectorMarketplaceProps> = ({
  onInstallConnector,
  onConfigureConnector,
  onUninstallConnector
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Filter connectors based on search and category
  const filteredConnectors = useMemo(() => {
    return mockConnectors.filter(connector => {
      const matchesSearch = connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           connector.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           connector.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || connector.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Sort connectors: featured first, then by rating
  const sortedConnectors = useMemo(() => {
    return [...filteredConnectors].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
    });
  }, [filteredConnectors]);

  const handleConnectorClick = useCallback((connector: Connector) => {
    console.log('🔥 handleConnectorClick called with:', connector.id, connector.name);
    // For GitHub Enterprise connector, always trigger configuration flow
    if (connector.id === 'github-enterprise') {
      console.log('🎯 GitHub Enterprise card clicked, installed:', connector.installed);
      if (connector.installed) {
        onConfigureConnector?.(connector.id);
      } else {
        // For uninstalled GitHub connector, trigger install which opens config
        console.log('📞 Calling onInstallConnector with:', connector.id, 'callback exists:', !!onInstallConnector);
        onInstallConnector?.(connector.id);
      }
    } else {
      // For other connectors, show detail dialog
      setSelectedConnector(connector);
      setDetailDialogOpen(true);
      setActiveTab(0);
    }
  }, [onConfigureConnector, onInstallConnector]);

  const handleInstall = useCallback((connectorId: string) => {
    onInstallConnector?.(connectorId);
    // Update local state
    const updatedConnectors = mockConnectors.map(c => 
      c.id === connectorId ? { ...c, installed: true } : c
    );
    setDetailDialogOpen(false);
  }, [onInstallConnector]);

  const handleConfigure = useCallback((connectorId: string) => {
    onConfigureConnector?.(connectorId);
  }, [onConfigureConnector]);

  const handleUninstall = useCallback((connectorId: string) => {
    onUninstallConnector?.(connectorId);
    // Update local state
    const updatedConnectors = mockConnectors.map(c => 
      c.id === connectorId ? { ...c, installed: false } : c
    );
  }, [onUninstallConnector]);

  const getPricingChip = (connector: Connector) => {
    switch (connector.pricing) {
      case 'free':
        return <Chip label="Free" size="small" color="success" />;
      case 'paid':
        return <Chip label={`$${connector.price}/mo`} size="small" color="warning" />;
      case 'freemium':
        return <Chip label="Freemium" size="small" color="info" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData?.icon || <Settings />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)'
              : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 1
          }}
        >
          Enterprise Integration Hub
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Configure and connect AgentHive to your existing enterprise tools and systems. Set up API credentials, test connections, and deploy AI workflows.
        </Typography>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search connectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {category.icon}
                    {category.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {sortedConnectors.length} connectors found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mockConnectors.filter(c => c.installed).length} connected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mockConnectors.filter(c => c.featured).length} featured
          </Typography>
        </Box>
      </Box>

      {/* Connector Grid */}
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3
        }}
      >
        {sortedConnectors.map((connector) => (
            <Card 
              key={connector.id}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
              onClick={() => {
                console.log('🖱️ Card clicked for:', connector.id);
                handleConnectorClick(connector);
              }}
            >
              {/* Featured Badge */}
              {connector.featured && (
                <Chip
                  label="Featured"
                  size="small"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                {/* Icon and Basic Info */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      mr: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      p: 1
                    }}
                  >
                    <img 
                      src={connector.icon} 
                      alt={`${connector.name} logo`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        // Fallback to first letter if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.textContent = connector.name.charAt(0);
                      }}
                    />
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" component="h3">
                        {connector.name}
                        {connector.verified && (
                          <Tooltip title="Verified Connector">
                            <Verified color="primary" sx={{ fontSize: 16 }} />
                          </Tooltip>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        by {connector.vendor}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Description */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {connector.description}
                </Typography>

                {/* Category and Pricing */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    icon={getCategoryIcon(connector.category)}
                    label={connector.category}
                    size="small"
                    variant="outlined"
                  />
                  {getPricingChip(connector)}
                </Box>

                {/* Rating and Downloads */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={connector.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="caption" color="text.secondary">
                      ({connector.rating})
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {connector.downloads.toLocaleString()} downloads
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ pt: 0 }}>
                {!connector.installed ? (
                  <Button
                    variant="contained"
                    startIcon={<Settings />}
                    onClick={() => handleConfigure(connector.id)}
                    sx={{
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                      }
                    }}
                  >
                    Configure
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircle />}
                    onClick={() => handleUninstall(connector.id)}
                    color="success"
                  >
                    Connected
                  </Button>
                )}
              </CardActions>
            </Card>
        ))}
      </Box>

      {/* Connector Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedConnector && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 40, height: 40, fontSize: '1.2rem' }}>
                    {selectedConnector.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {selectedConnector.name}
                      {selectedConnector.verified && (
                        <Verified color="primary" sx={{ ml: 1, fontSize: 20 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      by {selectedConnector.vendor} • v{selectedConnector.version}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Overview" />
                <Tab label="API & Integration" />
                <Tab label="Security & Compliance" />
                <Tab label="Reviews" />
              </Tabs>

              <Box sx={{ mt: 3 }}>
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {selectedConnector.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                      {getPricingChip(selectedConnector)}
                      <Chip
                        icon={getCategoryIcon(selectedConnector.category)}
                        label={selectedConnector.category}
                        size="small"
                        variant="outlined"
                      />
                      {selectedConnector.featured && (
                        <Chip label="Featured" size="small" color="primary" />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Rating value={selectedConnector.rating} precision={0.1} readOnly />
                      <Typography variant="body2">
                        {selectedConnector.rating} ({selectedConnector.downloads.toLocaleString()} downloads)
                      </Typography>
                    </Box>

                    <Typography variant="h6" sx={{ mb: 2 }}>Tags</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                      {selectedConnector.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box>
                    {/* API Endpoints */}
                    {selectedConnector.apiEndpoints && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>API Endpoints</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {selectedConnector.apiEndpoints.map((endpoint, index) => (
                            <Card key={index} variant="outlined" sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Chip 
                                  label={endpoint.method} 
                                  size="small" 
                                  color={endpoint.method === 'GET' ? 'success' : endpoint.method === 'POST' ? 'primary' : 'default'}
                                />
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                                  {endpoint.path}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {endpoint.description}
                              </Typography>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Authentication Methods */}
                    {selectedConnector.authMethods && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Authentication Methods</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {selectedConnector.authMethods.map((method) => (
                            <Chip 
                              key={method} 
                              label={method} 
                              variant="outlined" 
                              color="primary"
                              icon={<Security />}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Enterprise Features */}
                    {selectedConnector.enterpriseFeatures && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Enterprise Features</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {selectedConnector.enterpriseFeatures.map((feature) => (
                            <Chip 
                              key={feature} 
                              label={feature} 
                              variant="filled" 
                              color="secondary"
                              icon={<Business />}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" sx={{ mb: 2 }}>Integration Details</Typography>
                    <Box 
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 2
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Version</Typography>
                        <Typography variant="body2">{selectedConnector.version}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                        <Typography variant="body2">{selectedConnector.lastUpdated}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Compatibility</Typography>
                        <Typography variant="body2">{selectedConnector.compatibility.join(', ')}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Permissions</Typography>
                        <Typography variant="body2">
                          {selectedConnector.permissions ? selectedConnector.permissions.length : 0} required
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {activeTab === 2 && (
                  <Box>
                    {/* Compliance Certifications */}
                    {selectedConnector.compliance && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Compliance Certifications</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          {selectedConnector.compliance.map((cert) => (
                            <Card key={cert} variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: 120 }}>
                              <Security color="success" sx={{ fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" fontWeight="bold">{cert}</Typography>
                              <Typography variant="caption" color="text.secondary">Certified</Typography>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Security Features */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Security Features</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Security color="success" />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">End-to-End Encryption</Typography>
                            <Typography variant="caption" color="text.secondary">All data encrypted in transit and at rest</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Security color="success" />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">Role-Based Access Control</Typography>
                            <Typography variant="caption" color="text.secondary">Granular permissions and user management</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Security color="success" />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">Audit Logging</Typography>
                            <Typography variant="caption" color="text.secondary">Complete activity tracking and compliance reporting</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {/* Permissions Required */}
                    {selectedConnector.permissions && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Required Permissions</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {selectedConnector.permissions.map((permission) => (
                            <Chip 
                              key={permission} 
                              label={permission} 
                              size="small" 
                              variant="outlined"
                              color="warning"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" sx={{ mb: 2 }}>Support & Documentation</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {selectedConnector.documentation && (
                        <Button
                          variant="outlined"
                          startIcon={<Info />}
                          onClick={() => window.open(selectedConnector.documentation, '_blank')}
                        >
                          Documentation
                        </Button>
                      )}
                      {selectedConnector.supportUrl && (
                        <Button
                          variant="outlined"
                          onClick={() => window.open(selectedConnector.supportUrl, '_blank')}
                        >
                          Support
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}

                {activeTab === 3 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Reviews and ratings coming soon...
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions>
              {selectedConnector.installed ? (
                <>
                  <Button
                    onClick={() => handleConfigure(selectedConnector.id)}
                    startIcon={<Settings />}
                  >
                    Configure
                  </Button>
                  <Button
                    onClick={() => handleUninstall(selectedConnector.id)}
                    color="error"
                  >
                    Uninstall
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleInstall(selectedConnector.id)}
                  variant="contained"
                  startIcon={<GetApp />}
                >
                  Install Connector
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ConnectorMarketplace;
