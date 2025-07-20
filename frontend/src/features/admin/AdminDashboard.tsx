import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../../shared/styles/theme';
import AdminLayout from './AdminLayout';
import DashboardOverview from './DashboardOverview';
import ConnectorDetail from './ConnectorDetail';
import { ConnectorMarketplaceWrapper } from '../../core/admin/components/ConnectorMarketplaceWrapper';
import MockStudio from './MockStudio';
import ToolBusDashboard from './ToolBusDashboard';
import TraceExplorer from './TraceExplorer';
import AgentManagement from './AgentManagement';

// Placeholder components for future sections
const SecurityPolicies = () => <div>Security & Policies - Coming Soon</div>;
const UserManagement = () => <div>User Management - Coming Soon</div>;
const OnboardingTools = () => <div>Onboarding Tools - Coming Soon</div>;
const Analytics = () => <div>Analytics - Coming Soon</div>;
const SystemSettings = () => <div>System Settings - Coming Soon</div>;

const AdminDashboard: React.FC = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('agentHiveTheme') as 'light' | 'dark';
    if (savedTheme) {
      setThemeMode(savedTheme);
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('agentHiveTheme', newMode);
  };

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AdminLayout toggleTheme={toggleTheme} mode={themeMode}>
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          {/* Redirect /admin/connectors to marketplace */}
          <Route path="connectors" element={<Navigate to="/admin/connectors/marketplace" replace />} />
          <Route path="connectors/:id" element={<ConnectorDetail />} />
          {/* ConnectorMarketplace - Now the primary connectors page */}
          <Route path="connectors/marketplace" element={<ConnectorMarketplaceWrapper />} />
          {/* Temporarily disabled while fixing Grid component issues */}
          {/* <Route path="connectors/partner-onboarding" element={<PartnerOnboarding />} /> */}
          {/* <Route path="connectors/configure/:id" element={<ConnectorConfiguration />} /> */}
          <Route path="tool-bus" element={<ToolBusDashboard />} />
          <Route path="traces" element={<TraceExplorer />} />
          <Route path="agents" element={<AgentManagement />} />
          <Route path="mock-studio" element={<MockStudio />} />
          <Route path="policies" element={<SecurityPolicies />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="onboarding" element={<OnboardingTools />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<SystemSettings />} />
        </Routes>
      </AdminLayout>
    </ThemeProvider>
  );
};

export default AdminDashboard;
