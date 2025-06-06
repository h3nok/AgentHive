import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Rating,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  GetApp as InstallIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  Category as CategoryIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  useDiscoverPluginsQuery,
  useSearchPluginsQuery,
  useGetPluginDetailsQuery,
  useInstallPluginMutation,
  useGetPluginStoreStatsQuery,
  useSyncMarketplaceMutation,
  type PluginInfo,
  type PluginInstallRequest,
} from '../../features/plugins/pluginApi';

const PluginMarketplacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads' | 'updated_at'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInfo | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  // API hooks
  const { data: pluginStats, isLoading: statsLoading } = useGetPluginStoreStatsQuery();
  const { data: discoveredPlugins, isLoading: discoveryLoading, refetch: refetchPlugins } = useDiscoverPluginsQuery({
    category: selectedCategory || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    limit: 50,
  });
  
  const { data: searchResults, isLoading: searchLoading } = useSearchPluginsQuery(
    { query: searchQuery, category: selectedCategory || undefined },
    { skip: !searchQuery }
  );

  const { data: pluginDetails, isLoading: detailsLoading } = useGetPluginDetailsQuery(
    selectedPlugin?.id || '',
    { skip: !selectedPlugin }
  );

  const [installPlugin, { isLoading: installing }] = useInstallPluginMutation();
  const [syncMarketplace, { isLoading: syncing }] = useSyncMarketplaceMutation();

  // Determine which plugins to display
  const displayedPlugins = useMemo(() => {
    if (searchQuery && searchResults) {
      return searchResults;
    }
    return discoveredPlugins || [];
  }, [searchQuery, searchResults, discoveredPlugins]);

  const categories = useMemo(() => {
    if (!pluginStats?.categories) return [];
    return Object.keys(pluginStats.categories);
  }, [pluginStats]);

  const handlePluginSelect = (plugin: PluginInfo) => {
    setSelectedPlugin(plugin);
    setDetailsOpen(true);
  };

  const handleInstallClick = (plugin: PluginInfo) => {
    setSelectedPlugin(plugin);
    setInstallDialogOpen(true);
  };

  const handleInstallConfirm = async () => {
    if (!selectedPlugin) return;

    try {
      const request: PluginInstallRequest = {
        plugin_id: selectedPlugin.id,
        version: selectedPlugin.version,
        auto_enable: true,
      };

      await installPlugin(request).unwrap();
      setInstallDialogOpen(false);
      setSelectedPlugin(null);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleSyncMarketplace = async () => {
    try {
      await syncMarketplace().unwrap();
      refetchPlugins();
    } catch (error) {
      console.error('Marketplace sync failed:', error);
    }
  };

  const isLoading = discoveryLoading || searchLoading || statsLoading;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Plugin Marketplace
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Sync with marketplace">
            <IconButton onClick={handleSyncMarketplace} disabled={syncing}>
              {syncing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CategoryIcon color="primary" />
                <Box>
                  <Typography variant="h4">
                    {pluginStats?.total_available || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Available Plugins
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
                <DownloadIcon color="success" />
                <Box>
                  <Typography variant="h4">
                    {pluginStats?.total_installed || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Installed
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
                <CategoryIcon color="info" />
                <Box>
                  <Typography variant="h4">
                    {categories.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Categories
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
                <TrendingIcon color="warning" />
                <Box>
                  <Typography variant="h4">
                    {pluginStats?.most_popular?.length || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Popular
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: '2fr 1.5fr 1fr 1fr' 
            }, 
            gap: 2, 
            alignItems: 'center' 
          }}>
            <Box>
              <TextField
                fullWidth
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>
            
            <Box>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)} 
                      <Chip 
                        size="small" 
                        label={pluginStats?.categories[category] || 0} 
                        sx={{ ml: 1 }} 
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'downloads' | 'updated_at')}
                  label="Sort By"
                >
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="downloads">Downloads</MenuItem>
                  <MenuItem value="updated_at">Updated</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  label="Order"
                >
                  <MenuItem value="desc">Descending</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Plugin Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 3 
        }}>
          {displayedPlugins.map((plugin) => (
            <Box key={plugin.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: (theme: { shadows: string[] }) => theme.shadows[4],
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                onClick={() => handlePluginSelect(plugin)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" noWrap sx={{ flexGrow: 1, pr: 1 }}>
                      {plugin.name}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={plugin.category} 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    v{plugin.version} by {plugin.author}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {plugin.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Rating value={plugin.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" color="text.secondary">
                      ({plugin.rating?.toFixed(1) || 'N/A'})
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {plugin.tags?.slice(0, 3).map((tag) => (
                      <Chip key={tag} size="small" label={tag} variant="outlined" />
                    ))}
                    {plugin.tags?.length > 3 && (
                      <Chip size="small" label={`+${plugin.tags.length - 3}`} variant="outlined" />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      <DownloadIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      {plugin.downloads?.toLocaleString() || 0}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handlePluginSelect(plugin);
                        }}
                      >
                        <InfoIcon />
                      </IconButton>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<InstallIcon />}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleInstallClick(plugin);
                        }}
                      >
                        Install
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {displayedPlugins.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mt: 3 }}>
          {searchQuery ? 'No plugins found matching your search.' : 'No plugins available in the marketplace.'}
        </Alert>
      )}

      {/* Plugin Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Plugin Details
        </DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : pluginDetails && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {pluginDetails.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                v{pluginDetails.version} by {pluginDetails.author}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Rating value={pluginDetails.rating} precision={0.1} readOnly />
                <Typography>({pluginDetails.rating?.toFixed(1) || 'N/A'})</Typography>
                <Chip label={pluginDetails.category} color="primary" />
              </Box>

              <Typography variant="body1" paragraph>
                {pluginDetails.description}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Capabilities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {pluginDetails.capabilities?.map((capability) => (
                  <Chip key={capability} label={capability} variant="outlined" />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {pluginDetails.tags?.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>

              {pluginDetails.homepage && (
                <Typography variant="body2">
                  <strong>Homepage:</strong>{' '}
                  <a href={pluginDetails.homepage} target="_blank" rel="noopener noreferrer">
                    {pluginDetails.homepage}
                  </a>
                </Typography>
              )}

              {pluginDetails.repository && (
                <Typography variant="body2">
                  <strong>Repository:</strong>{' '}
                  <a href={pluginDetails.repository} target="_blank" rel="noopener noreferrer">
                    {pluginDetails.repository}
                  </a>
                </Typography>
              )}

              <Typography variant="body2">
                <strong>Downloads:</strong> {pluginDetails.downloads?.toLocaleString() || 0}
              </Typography>
              
              <Typography variant="body2">
                <strong>License:</strong> {pluginDetails.license || 'Not specified'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<InstallIcon />}
            onClick={() => {
              setDetailsOpen(false);
              handleInstallClick(selectedPlugin!);
            }}
            disabled={!selectedPlugin}
          >
            Install Plugin
          </Button>
        </DialogActions>
      </Dialog>

      {/* Install Confirmation Dialog */}
      <Dialog
        open={installDialogOpen}
        onClose={() => setInstallDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Install Plugin
        </DialogTitle>
        <DialogContent>
          {selectedPlugin && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to install <strong>{selectedPlugin.name}</strong> v{selectedPlugin.version}?
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                This plugin will be automatically enabled after installation.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)} disabled={installing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleInstallConfirm}
            disabled={installing}
            startIcon={installing ? <CircularProgress size={16} /> : <InstallIcon />}
          >
            {installing ? 'Installing...' : 'Install'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PluginMarketplacePage;
