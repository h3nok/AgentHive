import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  MoreVert,
  CloudDownload,
  Settings,
  Info,
  Delete
} from '@mui/icons-material';
import { HealthChip, HealthStatus } from './HealthChip';
import { ConnectorIcon, ConnectorCategory } from './ConnectorIcon';

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
 * Props for the GalleryCard component
 */
export interface GalleryCardProps {
  /** Connector data to display */
  connector: ConnectorData;
  /** Callback when the card is clicked */
  onClick?: (connector: ConnectorData) => void;
  /** Callback when install button is clicked */
  onInstall?: (connector: ConnectorData) => void;
  /** Callback when configure button is clicked */
  onConfigure?: (connector: ConnectorData) => void;
  /** Callback when details button is clicked */
  onDetails?: (connector: ConnectorData) => void;
  /** Callback when uninstall is requested */
  onUninstall?: (connector: ConnectorData) => void;
  /** Whether the card is in loading state */
  loading?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
}

/**
 * Get health progress value based on status
 */
const getHealthProgress = (status: HealthStatus): number => {
  switch (status) {
    case 'healthy':
      return 100;
    case 'warning':
      return 75;
    case 'error':
      return 25;
    case 'paused':
      return 50;
    case 'not-installed':
    default:
      return 0;
  }
};

/**
 * GalleryCard component for displaying connector information in a gallery layout
 * 
 * @example
 * ```tsx
 * <GalleryCard
 *   connector={connectorData}
 *   onClick={handleCardClick}
 *   onInstall={handleInstall}
 *   onConfigure={handleConfigure}
 * />
 * ```
 */
export const GalleryCard: React.FC<GalleryCardProps> = ({
  connector,
  onClick,
  onInstall,
  onConfigure,
  onDetails,
  onUninstall,
  loading = false,
  disabled = false
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

  const handleCardClick = () => {
    if (!disabled && onClick) {
      onClick(connector);
    }
  };

  const handleInstall = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onInstall) {
      onInstall(connector);
    }
  };

  const handleConfigure = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onConfigure) {
      onConfigure(connector);
    }
  };

  const handleDetails = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    if (onDetails) {
      onDetails(connector);
    }
  };

  const handleUninstall = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    if (onUninstall) {
      onUninstall(connector);
    }
  };

  const isInstalled = connector.status !== 'not-installed';
  const healthProgress = getHealthProgress(connector.status);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: onClick && !disabled ? 'translateY(-2px)' : 'none',
          boxShadow: onClick && !disabled ? 4 : 1
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header with icon, name, and menu */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <ConnectorIcon
            category={connector.category}
            iconUrl={connector.logo}
            fallbackText={connector.name}
            size={40}
          />
          <Box sx={{ flexGrow: 1, ml: 2, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 600,
                lineHeight: 1.2,
                mb: 0.5
              }}
              noWrap
            >
              {connector.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              noWrap
            >
              {connector.vendor}
            </Typography>
          </Box>
          <IconButton 
            size="small"
            onClick={handleMenuOpen}
            disabled={disabled}
            sx={{ ml: 1 }}
          >
            <MoreVert />
          </IconButton>
        </Box>

        {/* Description */}
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2, 
            minHeight: 40,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {connector.description}
        </Typography>

        {/* Status and version */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HealthChip status={connector.status} />
          <Chip
            label={`v${connector.version}`}
            size="small"
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        </Box>

        {/* Metadata */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {connector.ports.length} ports • {connector.installCount.toLocaleString()} installs
        </Typography>

        {/* Health progress bar */}
        {isInstalled && (
          <LinearProgress 
            variant="determinate" 
            value={healthProgress}
            color={connector.status === 'healthy' ? 'success' : 
                   connector.status === 'warning' ? 'warning' : 'error'}
            sx={{ 
              height: 4, 
              borderRadius: 2,
              bgcolor: 'grey.200'
            }}
          />
        )}

        {loading && (
          <LinearProgress 
            sx={{ 
              mt: 1,
              height: 2, 
              borderRadius: 1
            }}
          />
        )}
      </CardContent>

      <Divider />
      
      {/* Action buttons */}
      <CardActions sx={{ p: 2, pt: 1.5 }}>
        {!isInstalled ? (
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<CloudDownload />}
            fullWidth
            onClick={handleInstall}
            disabled={disabled || loading}
          >
            Install
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Settings />}
              sx={{ flex: 1 }}
              onClick={handleConfigure}
              disabled={disabled || loading}
            >
              Configure
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Info />}
              sx={{ flex: 1 }}
              onClick={handleDetails}
              disabled={disabled || loading}
            >
              Details
            </Button>
          </Box>
        )}
      </CardActions>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleDetails}>
          <Info sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        {isInstalled && (
          <MenuItem onClick={handleConfigure}>
            <Settings sx={{ mr: 1 }} fontSize="small" />
            Configure
          </MenuItem>
        )}
        <Divider />
        {isInstalled && (
          <MenuItem onClick={handleUninstall} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Uninstall
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default GalleryCard;
