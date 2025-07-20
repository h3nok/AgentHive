import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import AgentHealthTable from '../components/AgentHealthTable';
import DashboardSkeleton from '../components/DashboardSkeleton';
import HeadsUpTile from '../components/HeadsUpTile';
import KpiRow from '../components/KpiRow/KpiRow';
import PlotsGrid from '../components/PlotsGrid';
import UsageTrendChart from '../components/UsageTrendChart/UsageTrendChart';
import CostTrendChart from '../components/CostTrendChart';
import { RouterAnalyticsDashboard } from '../components/RouterAnalytics';
import EnterpriseMetrics from '../../../shared/components/EnterpriseMetrics';
import AnalyticsDashboard from '../../workflows/AnalyticsDashboard';
import ContextEnginePanel from '../components/ContextEnginePanel';
import ConnectorMarketplace from '../components/ConnectorMarketplace';
import GitHubConnectorConfig from '../components/GitHubConnectorConfig';
import { useKpiMetrics } from '../hooks/useKpiMetrics';
import { useForecast } from '../hooks/useForecast';
import { useQueryClient } from '@tanstack/react-query';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const DashboardPage: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [showConnectorConfig, setShowConnectorConfig] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: kpiMetrics,
    isLoading: kpiLoading,
    refetch: refetchKpis,
  } = useKpiMetrics(autoRefresh);

  // Predictive heads-up forecast
  const { data: forecast } = useForecast();

  // Keyboard shortcuts: R = manual refresh, A = toggle auto
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        refetchKpis();
        queryClient.invalidateQueries();
      }
      if (e.key.toLowerCase() === 'a') {
        setAutoRefresh(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [refetchKpis, queryClient]);

  if (kpiLoading && !kpiMetrics) {
    return <DashboardSkeleton />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue: number) => setActiveTab(newValue)}
          aria-label="Dashboard Tabs"
        >
          <Tab label="System Overview" id="dashboard-tab-0" aria-controls="dashboard-tabpanel-0" />
          <Tab label="Router Analytics" id="dashboard-tab-1" aria-controls="dashboard-tabpanel-1" />
          <Tab label="Enterprise Metrics" id="dashboard-tab-2" aria-controls="dashboard-tabpanel-2" />
          <Tab label="Agent Analytics" id="dashboard-tab-3" aria-controls="dashboard-tabpanel-3" />
          <Tab label="Context Engine" id="dashboard-tab-4" aria-controls="dashboard-tabpanel-4" />
          <Tab label="Connector Marketplace" id="dashboard-tab-5" aria-controls="dashboard-tabpanel-5" />
        </Tabs>
      </Box>

      {/* System Overview Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0,2fr) minmax(0,1fr)' },
            gridTemplateRows: { xs: 'auto auto auto 1fr', md: 'auto auto 1fr' },
            gridTemplateAreas: {
              xs: `"kpi" "charts" "table" "plots"`,
              md: `"kpi kpi" "charts charts" "table plots"`,
            },
          }}
        >
          <Box gridArea="kpi">
            {forecast && (
              <Box sx={{ mb: 2 }}>
                <HeadsUpTile forecast={forecast} />
              </Box>
            )}
            <KpiRow metrics={kpiMetrics} />
          </Box>
          <Box gridArea="charts">
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <UsageTrendChart />
              <CostTrendChart />
            </Box>
          </Box>
          <Box gridArea="table" sx={{ minWidth: 0 }}>
            <AgentHealthTable />
          </Box>
          <Box gridArea="plots">
            <PlotsGrid />
          </Box>
        </Box>
      </TabPanel>

      {/* Router Analytics Tab */}
      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Router Analytics
        </Typography>
        <RouterAnalyticsDashboard />
      </TabPanel>

      {/* Enterprise Metrics Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Enterprise Performance Metrics
        </Typography>
        <EnterpriseMetrics />
      </TabPanel>

      {/* Agent Analytics Tab */}
      <TabPanel value={activeTab} index={3}>
        <AnalyticsDashboard />
      </TabPanel>

      {/* Context Engine Tab */}
      <TabPanel value={activeTab} index={4}>
        <ContextEnginePanel />
      </TabPanel>

      {/* Connector Marketplace Tab */}
      <TabPanel value={activeTab} index={5}>
        {showConnectorConfig && selectedConnectorId === 'github-enterprise' ? (
          <GitHubConnectorConfig 
            connectorId={selectedConnectorId}
            onSave={(config) => {
              console.log('Saving GitHub config:', config);
              setShowConnectorConfig(false);
              setSelectedConnectorId(null);
            }}
            onTest={(connectorId) => console.log('Testing connector:', connectorId)}
            onDelete={(connectorId) => {
              console.log('Deleting connector:', connectorId);
              setShowConnectorConfig(false);
              setSelectedConnectorId(null);
            }}
            onBack={() => {
              setShowConnectorConfig(false);
              setSelectedConnectorId(null);
            }}
          />
        ) : (
          <ConnectorMarketplace 
            onInstallConnector={(connectorId) => {
              console.log('Installing connector:', connectorId);
              if (connectorId === 'github-enterprise') {
                setSelectedConnectorId(connectorId);
                setShowConnectorConfig(true);
              }
            }}
            onConfigureConnector={(connectorId) => {
              console.log('Configuring connector:', connectorId);
              if (connectorId === 'github-enterprise') {
                setSelectedConnectorId(connectorId);
                setShowConnectorConfig(true);
              }
            }}
            onUninstallConnector={(connectorId) => console.log('Uninstalling connector:', connectorId)}
          />
        )}
      </TabPanel>
    </Box>
  );
};

export default DashboardPage;