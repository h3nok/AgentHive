import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from './components/AdminLayout';
import UnifiedAdminDashboard from './pages/UnifiedAdminDashboard';
import { DashboardPage } from './pages';
import UserManagementPage from './pages/UserManagementPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import PluginManagementPage from './pages/PluginManagementPage';
import PluginMarketplacePage from './pages/PluginMarketplacePage';
import MpcServersPage from './pages/MpcServersPage';
import SwarmDashboard from './pages/SwarmDashboard';
import RealTimePerformanceDashboard from './pages/RealTimePerformanceDashboard';
import MobileOptimizationDashboard from './pages/MobileOptimizationDashboard';
import EnterpriseCommandPage from './pages/EnterpriseCommandPage';
import WorkflowManagementPage from './pages/WorkflowManagementPage';
import AIAssistantManagementPage from './pages/AIAssistantManagementPage';
import AgentOrchestrationPage from './pages/AgentOrchestrationPage';

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
  // Add admin-page class to body when admin app is mounted
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout toggleTheme={toggleTheme} mode={mode}>
        <Routes>
          {/* Default redirect to Unified Admin Dashboard */}
          <Route index element={<Navigate to="overview" replace />} />
          {/* Unified Admin Dashboard - Main Overview */}
          <Route path="overview" element={<UnifiedAdminDashboard />} />
          
          {/* Enterprise Operations */}
          <Route path="enterprise-command" element={<EnterpriseCommandPage />} />
          <Route path="workflows" element={<WorkflowManagementPage />} />
          <Route path="ai-assistant" element={<AIAssistantManagementPage />} />
          <Route path="orchestration" element={<AgentOrchestrationPage />} />
          
          {/* Technical Administration */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="performance" element={<RealTimePerformanceDashboard />} />
          <Route path="mobile-optimization" element={<MobileOptimizationDashboard />} />
          <Route path="swarm" element={<SwarmDashboard />} />
          <Route path="mcp-servers" element={<MpcServersPage />} />
          <Route path="plugins" element={<PluginManagementPage />} />
          <Route path="marketplace" element={<PluginMarketplacePage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/admin/overview" replace />} />
        </Routes>
      </AdminLayout>
    </QueryClientProvider>
  );
};

export default AdminApp;