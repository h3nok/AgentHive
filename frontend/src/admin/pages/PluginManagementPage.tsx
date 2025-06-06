import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PlayArrow as EnableIcon,
  Stop as DisableIcon,
  Info as InfoIcon,
  Update as UpdateIcon,
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MonitorHeart as MonitorIcon,
} from '@mui/icons-material';
import {
  useGetInstalledPluginsQuery,
  useUninstallPluginMutation,
  useTogglePluginMutation,
  useConfigurePluginMutation,
  useGetPluginsHealthQuery,
  useRunPluginHealthCheckMutation,
  useCheckPluginUpdatesQuery,
  type InstalledPlugin,
  type PluginHealthResponse,
} from '../../features/plugins/pluginApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`plugin-tabpanel-${index}`}
      aria-labelledby={`plugin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PluginManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedPlugin, setSelectedPlugin] = useState<InstalledPlugin | null>(null);
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // API hooks
  const { data: installedPlugins, isLoading: pluginsLoading, refetch: refetchPlugins } = useGetInstalledPluginsQuery();
  const { data: pluginsHealth, isLoading: healthLoading, refetch: refetchHealth } = useGetPluginsHealthQuery({});
  
  const pluginIds = useMemo(() => installedPlugins?.map(p => p.id) || [], [installedPlugins]);
  const { data: availableUpdates, isLoading: updatesLoading } = useCheckPluginUpdatesQuery(pluginIds, {
    skip: pluginIds.length === 0
  });

  const [uninstallPlugin, { isLoading: uninstalling }] = useUninstallPluginMutation();
  const [togglePlugin, { isLoading: toggling }] = useTogglePluginMutation();
  const [runHealthCheck, { isLoading: healthChecking }] = useRunPluginHealthCheckMutation();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUninstallClick = (plugin: InstalledPlugin) => {
    setSelectedPlugin(plugin);
    setUninstallDialogOpen(true);
  };

  const handleUninstallConfirm = async () => {
    if (!selectedPlugin) return;

    try {
      await uninstallPlugin(selectedPlugin.id).unwrap();
      setUninstallDialogOpen(false);
      setSelectedPlugin(null);
      refetchPlugins();
    } catch (error) {
      console.error('Uninstall failed:', error);
    }
  };

  const handleTogglePlugin = async (plugin: InstalledPlugin) => {
    try {
      await togglePlugin({
        pluginId: plugin.id,
        enable: plugin.status !== 'active'
      }).unwrap();
      refetchPlugins();
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const handleHealthCheck = async (pluginId: string) => {
    try {
      await runHealthCheck(pluginId).unwrap();
      refetchHealth();
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <HealthyIcon color="success" />;
      case 'inactive':
        return <DisableIcon color="disabled" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getHealthIcon = (health: PluginHealthResponse) => {
    switch (health.status) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const activePlugins = installedPlugins?.filter(p => p.status === 'active') || [];
  const inactivePlugins = installedPlugins?.filter(p => p.status !== 'active') || [];
  const pluginsWithUpdates = installedPlugins?.filter(p => availableUpdates?.[p.id]) || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Plugin Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh plugins">
            <IconButton onClick={() => refetchPlugins()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh health data">
            <IconButton onClick={() => refetchHealth()}>
              <MonitorIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HealthyIcon color="success" />
                <Box>
                  <Typography variant="h4">
                    {installedPlugins?.length || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Installed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EnableIcon color="success" />
                <Box>
                  <Typography variant="h4">
                    {activePlugins.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DisableIcon color="disabled" />
                <Box>
                  <Typography variant="h4">
                    {inactivePlugins.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Inactive
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <UpdateIcon color="warning" />
                <Box>
                  <Typography variant="h4">
                    {pluginsWithUpdates.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Updates Available
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Plugins" />
          <Tab label="Health Monitor" />
          <Tab label="Updates" />
        </Tabs>
      </Box>

      {/* All Plugins Tab */}
      <TabPanel value={tabValue} index={0}>
        {pluginsLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
            {installedPlugins?.map((plugin) => (
              <Box key={plugin.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" noWrap sx={{ flexGrow: 1, pr: 1 }}>
                        {plugin.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(plugin.status)}
                        <Chip 
                          size="small" 
                          label={plugin.status} 
                          color={plugin.status === 'active' ? 'success' : plugin.status === 'error' ? 'error' : 'default'}
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      v{plugin.version} • {plugin.category}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {plugin.description}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {plugin.capabilities?.slice(0, 3).map((capability) => (
                        <Chip key={capability} size="small" label={capability} variant="outlined" />
                      ))}
                      {plugin.capabilities?.length > 3 && (
                        <Chip size="small" label={`+${plugin.capabilities.length - 3}`} variant="outlined" />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Installed:</strong> {new Date(plugin.installed_at).toLocaleDateString()}
                    </Typography>
                    
                    {plugin.last_used && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Last used:</strong> {new Date(plugin.last_used).toLocaleDateString()}
                      </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary">
                      <strong>Usage count:</strong> {plugin.usage_count || 0}
                    </Typography>

                    {plugin.error_message && (
                      <Alert severity="error" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        {plugin.error_message}
                      </Alert>
                    )}
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={plugin.status === 'active'}
                          onChange={() => handleTogglePlugin(plugin)}
                          disabled={toggling}
                        />
                      }
                      label="Active"
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {availableUpdates?.[plugin.id] && (
                        <Tooltip title="Update available">
                          <IconButton size="small" color="warning">
                            <UpdateIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Configure">
                        <IconButton size="small" onClick={() => {
                          setSelectedPlugin(plugin);
                          setConfigDialogOpen(true);
                        }}>
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Uninstall">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleUninstallClick(plugin)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {installedPlugins?.length === 0 && !pluginsLoading && (
          <Alert severity="info">
            No plugins are currently installed. Visit the Plugin Marketplace to discover and install plugins.
          </Alert>
        )}
      </TabPanel>

      {/* Health Monitor Tab */}
      <TabPanel value={tabValue} index={1}>
        {healthLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plugin</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>CPU Usage</TableCell>
                  <TableCell>Memory Usage</TableCell>
                  <TableCell>Error Count</TableCell>
                  <TableCell>Last Check</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pluginsHealth?.map((health) => {
                  const plugin = installedPlugins?.find(p => p.id === health.plugin_id);
                  return (
                    <TableRow key={health.plugin_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getHealthIcon(health)}
                          <Typography>
                            {plugin?.name || health.plugin_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={health.status} 
                          color={health.status === 'healthy' ? 'success' : health.status === 'warning' ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{health.response_time_ms}ms</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 80 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={health.cpu_usage} 
                              color={health.cpu_usage > 80 ? 'error' : health.cpu_usage > 60 ? 'warning' : 'primary'}
                            />
                          </Box>
                          <Typography variant="body2">
                            {health.cpu_usage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 80 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={health.memory_usage} 
                              color={health.memory_usage > 80 ? 'error' : health.memory_usage > 60 ? 'warning' : 'primary'}
                            />
                          </Box>
                          <Typography variant="body2">
                            {health.memory_usage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={health.error_count} 
                          color={health.error_count > 0 ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(health.last_check).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleHealthCheck(health.plugin_id)}
                          disabled={healthChecking}
                        >
                          {healthChecking ? <CircularProgress size={16} /> : <RefreshIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Updates Tab */}
      <TabPanel value={tabValue} index={2}>
        {updatesLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : pluginsWithUpdates.length > 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
            {pluginsWithUpdates.map((plugin) => {
              const updateInfo = availableUpdates?.[plugin.id];
              return (
                <Box key={plugin.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {plugin.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Current: v{plugin.version}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          Available: v{updateInfo?.version}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {updateInfo?.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          startIcon={<UpdateIcon />}
                          color="primary"
                          // onClick={() => handleUpdatePlugin(plugin)}
                        >
                          Update
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Alert severity="success">
            All plugins are up to date!
          </Alert>
        )}
      </TabPanel>

      {/* Uninstall Confirmation Dialog */}
      <Dialog
        open={uninstallDialogOpen}
        onClose={() => setUninstallDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Uninstall Plugin</DialogTitle>
        <DialogContent>
          {selectedPlugin && (
            <Box>
              <Typography gutterBottom>
                Are you sure you want to uninstall <strong>{selectedPlugin.name}</strong>?
              </Typography>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action cannot be undone. All plugin data and configuration will be permanently removed.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUninstallDialogOpen(false)} disabled={uninstalling}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleUninstallConfirm}
            disabled={uninstalling}
            startIcon={uninstalling ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {uninstalling ? 'Uninstalling...' : 'Uninstall'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PluginManagementPage;
