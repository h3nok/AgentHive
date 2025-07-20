/**
 * ConnectorGallery - Production-ready connector gallery using DashboardGrid
 * 
 * This component provides a modern, searchable gallery of enterprise connectors
 * with filtering, status indicators, and navigation to detail pages.
 * Uses the reusable DashboardGrid framework for consistent layout.
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Card,
  CardContent,

  IconButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Refresh,
  MoreVert,
  CloudDownload,
  Settings,
  Info,
  Delete
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';


import { HealthChip, HealthStatus } from '../../shared/components/ui/HealthChip';
import { ConnectorIcon, ConnectorCategory } from '../../shared/components/ui/ConnectorIcon';

/**
 * Connector data interface
 */
export interface ConnectorData {
  id: string;
  name: string;
  vendor: string;
  description: string;
  version: string;
  status: HealthStatus;
  category: ConnectorCategory;
  ports: string[];
  logo?: string;
  installCount: number;
  lastUpdated: string;
}

/**
 * Props for the ConnectorGallery component
 */
interface ConnectorGalleryProps {
  /** Optional array of connectors to display */
  connectors?: ConnectorData[];
}

/**
 * Mock connector data for development and testing
 */
const mockConnectors: ConnectorData[] = [
  {
    id: 'workday-hr',
    name: 'Workday HR',
    vendor: 'Workday Inc.',
    description: 'Complete HR management integration with employee data, payroll, and benefits',
    version: '2.1.0',
    status: 'healthy',
    category: 'hr',
    ports: ['hr.employee.query', 'hr.employee.update', 'hr.payroll.get'],
    installCount: 1247,
    lastUpdated: '2025-01-15'
  },
  {
    id: 'salesforce-crm',
    name: 'Salesforce CRM',
    vendor: 'Salesforce',
    description: 'Customer relationship management with leads, opportunities, and account data',
    version: '1.8.3',
    status: 'warning',
    category: 'crm',
    ports: ['crm.lead.query', 'crm.opportunity.create', 'crm.account.update'],
    installCount: 892,
    lastUpdated: '2025-01-10'
  },
  {
    id: 'servicenow-itsm',
    name: 'ServiceNow ITSM',
    vendor: 'ServiceNow',
    description: 'IT service management with incident, change, and problem management',
    version: '3.0.1',
    status: 'healthy',
    category: 'itsm',
    ports: ['itsm.incident.create', 'itsm.change.query', 'itsm.problem.update'],
    installCount: 634,
    lastUpdated: '2025-01-12'
  },
  {
    id: 'sap-erp',
    name: 'SAP ERP',
    vendor: 'SAP SE',
    description: 'Enterprise resource planning with finance, procurement, and inventory',
    version: '4.2.0',
    status: 'not-installed',
    category: 'erp',
    ports: ['erp.finance.query', 'erp.procurement.create', 'erp.inventory.update'],
    installCount: 423,
    lastUpdated: '2025-01-08'
  },
  {
    id: 'azure-ad',
    name: 'Azure Active Directory',
    vendor: 'Microsoft',
    description: 'Identity and access management with user authentication and authorization',
    version: '1.5.2',
    status: 'healthy',
    category: 'security',
    ports: ['auth.user.query', 'auth.group.manage', 'auth.token.validate'],
    installCount: 2156,
    lastUpdated: '2025-01-18'
  },
  {
    id: 'snowflake-analytics',
    name: 'Snowflake Analytics',
    vendor: 'Snowflake Inc.',
    description: 'Cloud data warehouse with advanced analytics and machine learning capabilities',
    version: '3.1.4',
    status: 'paused',
    category: 'analytics',
    ports: ['data.query.execute', 'data.warehouse.manage', 'ml.model.deploy'],
    installCount: 567,
    lastUpdated: '2025-01-14'
  }
];

/**
 * Create connector card component using DashboardGrid framework
 */
const ConnectorCard: React.FC<{ 
  connector: ConnectorData; 
  onAction: (action: string, connector: ConnectorData) => void;
  navigate: (path: string) => void;
}> = ({ 
  connector, 
  onAction,
  navigate
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    handleMenuClose();
    onAction(action, connector);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        minHeight: '420px',  // Ensure minimum height to prevent cropping
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 12px 40px rgba(251, 191, 36, 0.15), 0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 12px 40px rgba(245, 158, 11, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
        },
        border: (theme) => theme.palette.mode === 'dark'
          ? '1px solid rgba(251, 191, 36, 0.1)'
          : '1px solid rgba(245, 158, 11, 0.08)',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, #2d2d2d 0%, #383838 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
      }}
      onClick={() => onAction('details', connector)}
    >
      <CardContent sx={{ 
        flexGrow: 1, 
        pb: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '280px',  // Ensure content area has enough space
        overflow: 'visible'  // Prevent content clipping
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <ConnectorIcon
            category={connector.category}
            iconUrl={connector.logo}
            fallbackText={connector.name}
            size={40}
          />
          <Box sx={{ flexGrow: 1, ml: 2, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.2, mb: 0.5 }} noWrap>
              {connector.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {connector.vendor}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuOpen} sx={{ ml: 1 }}>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Description - Full content display */}
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2, 
            flexGrow: 1,  // Take available space
            lineHeight: 1.5,
            color: 'text.secondary',
            overflow: 'visible',  // Show all content
            wordWrap: 'break-word',  // Handle long words
            hyphens: 'auto'  // Better text wrapping
          }}
        >
          {connector.description}
        </Typography>

        {/* Status and version */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HealthChip status={connector.status} />
          <Chip label={`v${connector.version}`} size="small" variant="outlined" sx={{ ml: 'auto' }} />
        </Box>

        {/* Enhanced Metadata */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {connector.ports.length} ports • {connector.installCount.toLocaleString()} installs
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Updated: {new Date(connector.lastUpdated).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>

      <Divider />
      
      {/* Actions */}
      <Box sx={{ p: 2, pt: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/admin/connectors/marketplace')}
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              '&:hover': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                transform: 'scale(1.02)',
              },
              transition: 'all 0.2s ease-in-out',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Browse Marketplace
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin/connectors/partner-onboarding')}
            sx={{
              borderColor: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.3)'
                : 'rgba(245, 158, 11, 0.3)',
              color: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.8)'
                : 'rgba(245, 158, 11, 0.8)',
              '&:hover': {
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.6)'
                  : 'rgba(245, 158, 11, 0.6)',
                backgroundColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
              },
              fontWeight: 500,
              textTransform: 'none',
            }}
          >
            Become a Partner
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => console.log('Refresh connectors')}
            sx={{
              borderColor: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.3)'
                : 'rgba(245, 158, 11, 0.3)',
              color: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.8)'
                : 'rgba(245, 158, 11, 0.8)',
              '&:hover': {
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.6)'
                  : 'rgba(245, 158, 11, 0.6)',
                backgroundColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
              },
              fontWeight: 500,
              textTransform: 'none',
            }}
          >
            Refresh
          </Button>
        </Box>
        {connector.status === 'not-installed' ? (
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<CloudDownload />}
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onAction('install', connector);
            }}
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              '&:hover': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                transform: 'scale(1.02)',
              },
              transition: 'all 0.2s ease-in-out',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Install
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Settings />}
              sx={{ 
                flex: 1,
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.3)'
                  : 'rgba(245, 158, 11, 0.3)',
                color: (theme) => theme.palette.mode === 'dark'
                  ? '#fbbf24'
                  : '#f59e0b',
                '&:hover': {
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.6)'
                    : 'rgba(245, 158, 11, 0.6)',
                  backgroundColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.08)'
                    : 'rgba(245, 158, 11, 0.08)',
                  transform: 'scale(1.02)',
                },
                transition: 'all 0.2s ease-in-out',
                fontWeight: 500,
                textTransform: 'none',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAction('configure', connector);
              }}
            >
              Configure
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Info />}
              sx={{ 
                flex: 1,
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.3)'
                  : 'rgba(245, 158, 11, 0.3)',
                color: (theme) => theme.palette.mode === 'dark'
                  ? '#fbbf24'
                  : '#f59e0b',
                '&:hover': {
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.6)'
                    : 'rgba(245, 158, 11, 0.6)',
                  backgroundColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.08)'
                    : 'rgba(245, 158, 11, 0.08)',
                  transform: 'scale(1.02)',
                },
                transition: 'all 0.2s ease-in-out',
                fontWeight: 500,
                textTransform: 'none',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAction('details', connector);
              }}
            >
              Details
            </Button>
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleAction('details')}>
          <Info sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        {connector.status !== 'not-installed' && (
          <MenuItem onClick={() => handleAction('configure')}>
            <Settings sx={{ mr: 1 }} fontSize="small" />
            Configure
          </MenuItem>
        )}
        <Divider />
        {connector.status !== 'not-installed' && (
          <MenuItem onClick={() => handleAction('uninstall')} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Uninstall
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

/**
 * ConnectorGallery component using DashboardGrid framework
 * 
 * Features:
 * - Reusable DashboardGrid layout
 * - Search and filter functionality
 * - Draggable/resizable connector cards
 * - Navigation to connector detail pages
 * - Install/configure actions
 * 
 * @example
 * ```tsx
 * <ConnectorGallery connectors={connectorList} />
 * ```
 */
const ConnectorGallery: React.FC<ConnectorGalleryProps> = ({ 
  connectors = mockConnectors 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  /**
   * Handle connector actions
   */
  const handleConnectorAction = useCallback((action: string, connector: ConnectorData) => {
    switch (action) {
      case 'details':
        navigate(`/admin/connectors/${connector.id}`);
        break;
      case 'configure':
        navigate(`/admin/connectors/${connector.id}/configure`);
        break;
      case 'install':
        console.log('Installing connector:', connector.id);
        // TODO: Implement installation logic
        break;
      case 'uninstall':
        console.log('Uninstalling connector:', connector.id);
        // TODO: Implement uninstall logic with confirmation dialog
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }, [navigate]);

  // Filter connectors based on search term and category
  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connector.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connector.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || connector.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter chips
  const categories = Array.from(new Set(connectors.map(c => c.category)));

  // Create dashboard cards for DashboardGrid with dynamic layout
  // Uniform 4x6 cards for compact professional layout
  // CSS column-based masonry to allow content-aware card height without extra dependencies
  const masonryCards = filteredConnectors.map((connector) => (
    <Box key={connector.id} sx={{ breakInside: 'avoid', mb: 3 }}>
      <ConnectorCard connector={connector} onAction={handleConnectorAction} navigate={navigate} />
    </Box>
  ));

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Search and Filters */}
      <Box sx={{ 
        p: 3, 
        pb: 2, 
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.8) 0%, rgba(56, 56, 56, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: (theme) => theme.palette.mode === 'dark'
          ? '1px solid rgba(251, 191, 36, 0.1)'
          : '1px solid rgba(245, 158, 11, 0.1)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              Connector Gallery
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Discover and manage enterprise connectors for your AgentHive platform
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<Add />} 
              size="small"
              sx={{
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.4)'
                  : 'rgba(245, 158, 11, 0.4)',
                color: (theme) => theme.palette.mode === 'dark'
                  ? '#fbbf24'
                  : '#f59e0b',
                '&:hover': {
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.8)'
                    : 'rgba(245, 158, 11, 0.8)',
                  backgroundColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
                fontWeight: 500,
                textTransform: 'none',
              }}
            >
              Add Connector
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />} 
              size="small"
              sx={{
                borderColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.4)'
                  : 'rgba(245, 158, 11, 0.4)',
                color: (theme) => theme.palette.mode === 'dark'
                  ? '#fbbf24'
                  : '#f59e0b',
                '&:hover': {
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.8)'
                    : 'rgba(245, 158, 11, 0.8)',
                  backgroundColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
                fontWeight: 500,
                textTransform: 'none',
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Search and Filter Controls */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search connectors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: 300, 
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '& fieldset': {
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.4)'
                    : 'rgba(245, 158, 11, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? '#fbbf24'
                    : '#f59e0b',
                },
              },
            }}
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterList color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Filter by category:
          </Typography>
          {['all', ...categories].map((category) => (
            <Chip
              key={category}
              label={category === 'all' ? 'All' : category.toUpperCase()}
              onClick={() => setFilterCategory(category)}
              variant={filterCategory === category ? 'filled' : 'outlined'}
              size="small"
              sx={{ 
                textTransform: 'capitalize',
                fontWeight: 500,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                ...(filterCategory === category ? {
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    transform: 'scale(1.05)',
                  },
                } : {
                  borderColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.3)'
                    : 'rgba(245, 158, 11, 0.3)',
                  color: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.8)'
                    : 'rgba(245, 158, 11, 0.8)',
                  backgroundColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(251, 191, 36, 0.05)'
                    : 'rgba(245, 158, 11, 0.05)',
                  '&:hover': {
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(251, 191, 36, 0.6)'
                      : 'rgba(245, 158, 11, 0.6)',
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(251, 191, 36, 0.1)'
                      : 'rgba(245, 158, 11, 0.1)',
                    transform: 'scale(1.05)',
                  },
                }),
              }}
            />
          ))}
        </Box>

        {/* Results Count */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Showing {filteredConnectors.length} of {connectors.length} connectors
        </Typography>
      </Box>

      {/* Content-aware masonry layout with CSS columns */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {masonryCards.length > 0 ? (
          <Box sx={{
            columnCount: { xs: 1, sm: 2, md: 3 },
            columnGap: (theme) => theme.spacing(3),
            width: '100%',
          }}>
            {masonryCards}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No connectors found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ConnectorGallery;
