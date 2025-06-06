import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from './components/AdminLayout';
import { DashboardPage } from './pages';
import AgentCatalog from '../pages/AgentCatalog';
import UserManagementPage from './pages/UserManagementPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import PluginManagementPage from './pages/PluginManagementPage';
import PluginMarketplacePage from './pages/PluginMarketplacePage';
import MpcServersPage from './pages/MpcServersPage';

interface AdminAppProps {
  toggleTheme?: () => void;
  mode?: 'light' | 'dark';
}

// Create a query client instance for the admin section
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const AdminApp: React.FC<AdminAppProps> = ({ toggleTheme, mode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout toggleTheme={toggleTheme} mode={mode}>
        <Routes>
          {/* Default redirect to Agent Marketplace */}
          <Route index element={<Navigate to="marketplace" replace />} />
          {/* Dashboard page */}
          <Route path="dashboard" element={<DashboardPage />} />
          {/* Agent catalog */}
          <Route path="agents" element={<AgentCatalog />} />
          {/* MPC Servers */}
          <Route path="mpc-servers" element={<MpcServersPage />} />
          {/* Plugin management */}
          <Route path="plugins" element={<PluginManagementPage />} />
          <Route path="marketplace" element={<PluginMarketplacePage />} />
          {/* User Mgmt, Reports, Settings */}
          <Route path="users" element={<UserManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AdminLayout>
    </QueryClientProvider>
  );
};

export default AdminApp;