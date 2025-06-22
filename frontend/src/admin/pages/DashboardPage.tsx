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
import EnterpriseMetrics from '../../components/EnterpriseMetrics';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';
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
          onChange={(event: React.SyntheticEvent, newValue: number) => setActiveTab(newValue)}
          aria-label="Dashboard Tabs"
        >
          <Tab label="System Overview" id="dashboard-tab-0" aria-controls="dashboard-tabpanel-0" />
          <Tab label="Router Analytics" id="dashboard-tab-1" aria-controls="dashboard-tabpanel-1" />
          <Tab label="Enterprise Metrics" id="dashboard-tab-2" aria-controls="dashboard-tabpanel-2" />
          <Tab label="Agent Analytics" id="dashboard-tab-3" aria-controls="dashboard-tabpanel-3" />
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
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Agent Analytics & Performance
        </Typography>
        <AnalyticsDashboard 
          systemMetrics={{
            totalAgents: 5,
            activeAgents: 3,
            totalQueries: 12456,
            avgResponseTime: 145,
            successRate: 98.5,
            tokensUsed: 234567,
            cost: 45.67,
            uptime: 99.98,
            errorRate: 0.02
          }}
          agentMetrics={[
            {
              agentId: 'general',
              agentName: 'General Assistant',
              totalQueries: 1456,
              successRate: 98.5,
              avgResponseTime: 1200,
              tokensUsed: 45000,
              errorRate: 0.015,
              uptime: 99.9,
              lastActivity: new Date().toISOString(),
              trend: 'up' as const,
              status: 'active' as const
            },
            {
              agentId: 'technical',
              agentName: 'Technical Expert',
              totalQueries: 890,
              successRate: 96.2,
              avgResponseTime: 1450,
              tokensUsed: 32000,
              errorRate: 0.038,
              uptime: 98.7,
              lastActivity: new Date().toISOString(),
              trend: 'stable' as const,
              status: 'active' as const
            },
            {
              agentId: 'support',
              agentName: 'Support Agent',
              totalQueries: 2103,
              successRate: 99.1,
              avgResponseTime: 980,
              tokensUsed: 58000,
              errorRate: 0.009,
              uptime: 99.8,
              lastActivity: new Date().toISOString(),
              trend: 'up' as const,
              status: 'active' as const
            }
          ]}
          performanceData={[
            { timestamp: '2025-06-19T12:00:00Z', value: 45, label: '12:00' },
            { timestamp: '2025-06-19T13:00:00Z', value: 52, label: '13:00' },
            { timestamp: '2025-06-19T14:00:00Z', value: 38, label: '14:00' },
            { timestamp: '2025-06-19T15:00:00Z', value: 67, label: '15:00' },
            { timestamp: '2025-06-19T16:00:00Z', value: 58, label: '16:00' }
          ]}
          usageData={[
            { timestamp: '2025-06-19T12:00:00Z', value: 120, label: '12:00' },
            { timestamp: '2025-06-19T13:00:00Z', value: 145, label: '13:00' },
            { timestamp: '2025-06-19T14:00:00Z', value: 98, label: '14:00' },
            { timestamp: '2025-06-19T15:00:00Z', value: 189, label: '15:00' },
            { timestamp: '2025-06-19T16:00:00Z', value: 167, label: '16:00' }
          ]}
          errorData={[
            { timestamp: '2025-06-19T12:00:00Z', value: 2, label: '12:00' },
            { timestamp: '2025-06-19T13:00:00Z', value: 1, label: '13:00' },
            { timestamp: '2025-06-19T14:00:00Z', value: 3, label: '14:00' },
            { timestamp: '2025-06-19T15:00:00Z', value: 0, label: '15:00' },
            { timestamp: '2025-06-19T16:00:00Z', value: 1, label: '16:00' }
          ]}
          timeRange="24h"
          onTimeRangeChange={(range) => console.log('Time range changed:', range)}
          onRefresh={() => console.log('Refreshing analytics...')}
          onExport={(type) => console.log('Exporting as:', type)}
        />
      </TabPanel>
    </Box>
  );
};

export default DashboardPage;