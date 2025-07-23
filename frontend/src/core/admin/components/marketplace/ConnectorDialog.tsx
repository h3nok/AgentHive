import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  Rating,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Settings, GetApp, Close, CheckCircle, Security } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

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
  permissions?: string[];
  supportUrl?: string;
  apiEndpoints?: ApiEndpoint[];
  authMethods?: string[];
  compliance?: string[];
  enterpriseFeatures?: string[];
}

interface ConnectorDialogProps {
  open: boolean;
  connector: Connector | null;
  onClose: () => void;
  onInstall: (connectorId: string) => void;
  onConfigure: (connectorId: string) => void;
  onUninstall: (connectorId: string) => void;
}

const ConnectorDialog: React.FC<ConnectorDialogProps> = ({
  open,
  connector,
  onClose,
  onInstall,
  onConfigure,
  onUninstall,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);

  if (!connector) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={connector.icon} sx={{ width: 48, height: 48 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">{connector.name}</Typography>
              {connector.verified && <CheckCircle fontSize="small" color="success" />}
            </Box>
            <Typography variant="body2" color="text.secondary">
              by {connector.vendor} • v{connector.version}
            </Typography>
          </Box>
          <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Overview" />
          <Tab label="API & Security" />
          <Tab label="Enterprise" />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {connector.description}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {connector.tags.map((tag) => (
                <Chip key={tag} size="small" label={tag} />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Rating</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={connector.rating} size="small" precision={0.1} readOnly />
                  <Typography variant="body2">({connector.rating})</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Downloads</Typography>
                <Typography variant="body2">{connector.downloads.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Category</Typography>
                <Typography variant="body2">{connector.category}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Compatibility</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {connector.compatibility.map((comp) => (
                <Chip key={comp} size="small" label={comp} variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Authentication Methods</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {connector.authMethods?.map((method) => (
                <Chip key={method} size="small" label={method} icon={<Security />} />
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>API Endpoints</Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {connector.apiEndpoints?.map((endpoint, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    <strong>{endpoint.method}</strong> {endpoint.path}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {endpoint.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Compliance Standards</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {connector.compliance?.map((standard) => (
                <Chip key={standard} size="small" label={standard} color="success" />
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Enterprise Features</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {connector.enterpriseFeatures?.map((feature) => (
                <Chip key={feature} size="small" label={feature} variant="outlined" />
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Required Permissions</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {connector.permissions?.map((permission) => (
                <Chip key={permission} size="small" label={permission} />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {connector.installed ? (
          <>
            <Button
              onClick={() => onConfigure(connector.id)}
              startIcon={<Settings />}
            >
              Configure
            </Button>
            <Button
              onClick={() => onUninstall(connector.id)}
              color="error"
            >
              Uninstall
            </Button>
          </>
        ) : (
          <Button
            onClick={() => onInstall(connector.id)}
            variant="contained"
            startIcon={<GetApp />}
          >
            Install Connector
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConnectorDialog;
