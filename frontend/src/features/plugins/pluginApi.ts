/**
 * Plugin Marketplace API - RTK Query service for plugin management
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base URL for API - use consistent environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  author_email?: string;
  category: string;
  tags: string[];
  homepage?: string;
  repository?: string;
  license?: string;
  created_at: string;
  updated_at: string;
  downloads: number;
  rating: number;
  requirements: Record<string, unknown>;
  capabilities: string[];
  metadata: Record<string, unknown>;
}

export interface InstalledPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  status: 'active' | 'inactive' | 'error';
  installed_at: string;
  configuration: Record<string, unknown>;
  dependencies: Record<string, string>;
  capabilities: string[];
  metadata: Record<string, unknown>;
  last_used?: string;
  usage_count: number;
  error_message?: string;
}

export interface PluginHealthResponse {
  plugin_id: string;
  status: 'healthy' | 'warning' | 'error';
  last_check: string;
  response_time_ms: number;
  cpu_usage: number;
  memory_usage: number;
  error_count: number;
  metrics: Record<string, unknown>;
  issues: string[];
}

export interface PluginOperationResponse {
  success: boolean;
  message: string;
  plugin_id: string;
  details?: Record<string, unknown>;
}

export interface PluginStoreStats {
  total_available: number;
  total_installed: number;
  categories: Record<string, number>;
  top_categories: string[];
  most_popular: string[];
  recently_updated: string[];
}

export interface PluginDiscoveryQuery {
  category?: string;
  tags?: string[];
  author?: string;
  min_rating?: number;
  sort_by?: 'name' | 'rating' | 'downloads' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PluginInstallRequest {
  plugin_id: string;
  version?: string;
  configuration?: Record<string, unknown>;
  auto_enable?: boolean;
}

export interface PluginUpdateRequest {
  plugin_id: string;
  version?: string;
  configuration?: Record<string, unknown>;
}

export const pluginApi = createApi({
  reducerPath: 'pluginApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/plugins`,
    prepareHeaders: (headers) => {
      // Add authentication headers if needed
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Plugin', 'InstalledPlugin', 'PluginHealth', 'PluginStats'],
  endpoints: (builder) => ({
    // Discovery and marketplace endpoints
    discoverPlugins: builder.query<PluginInfo[], PluginDiscoveryQuery>({
      query: (params) => ({
        url: '/discover',
        params,
      }),
      providesTags: ['Plugin'],
    }),

    searchPlugins: builder.query<PluginInfo[], { query: string; category?: string; limit?: number }>({
      query: ({ query, category, limit = 20 }) => ({
        url: '/search',
        params: { query, category, limit },
      }),
      providesTags: ['Plugin'],
    }),

    getPluginDetails: builder.query<PluginInfo, string>({
      query: (pluginId) => `/details/${pluginId}`,
      providesTags: (_result, _error, id) => [{ type: 'Plugin', id }],
    }),

    // Installation and management endpoints
    installPlugin: builder.mutation<PluginOperationResponse, PluginInstallRequest>({
      query: (data) => ({
        url: '/install',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['InstalledPlugin', 'PluginStats'],
    }),

    uninstallPlugin: builder.mutation<PluginOperationResponse, string>({
      query: (pluginId) => ({
        url: `/uninstall/${pluginId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InstalledPlugin', 'PluginStats'],
    }),

    updatePlugin: builder.mutation<PluginOperationResponse, PluginUpdateRequest>({
      query: (data) => ({
        url: '/update',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['InstalledPlugin'],
    }),

    // Installed plugins management
    getInstalledPlugins: builder.query<InstalledPlugin[], void>({
      query: () => '/installed',
      providesTags: ['InstalledPlugin'],
    }),

    togglePlugin: builder.mutation<PluginOperationResponse, { pluginId: string; enable: boolean }>({
      query: ({ pluginId, enable }) => ({
        url: `/toggle/${pluginId}`,
        method: 'POST',
        params: { enable },
      }),
      invalidatesTags: ['InstalledPlugin'],
    }),

    configurePlugin: builder.mutation<PluginOperationResponse, { pluginId: string; configuration: Record<string, unknown> }>({
      query: ({ pluginId, configuration }) => ({
        url: `/configure/${pluginId}`,
        method: 'POST',
        body: { configuration },
      }),
      invalidatesTags: ['InstalledPlugin'],
    }),

    // Plugin updates
    checkPluginUpdates: builder.query<Record<string, PluginInfo>, string[]>({
      query: (pluginIds) => ({
        url: '/updates',
        params: { plugin_ids: pluginIds },
      }),
      providesTags: ['Plugin'],
    }),

    // Health monitoring endpoints
    getPluginsHealth: builder.query<PluginHealthResponse[], { pluginId?: string }>({
      query: ({ pluginId }) => ({
        url: '/health',
        params: pluginId ? { plugin_id: pluginId } : {},
      }),
      providesTags: ['PluginHealth'],
    }),

    runPluginHealthCheck: builder.mutation<PluginHealthResponse, string>({
      query: (pluginId) => ({
        url: `/health/check/${pluginId}`,
        method: 'POST',
      }),
      invalidatesTags: ['PluginHealth'],
    }),

    // Statistics and analytics
    getPluginStoreStats: builder.query<PluginStoreStats, void>({
      query: () => '/stats',
      providesTags: ['PluginStats'],
    }),

    // Marketplace sync
    syncMarketplace: builder.mutation<{ status: string; synced_count: number }, void>({
      query: () => ({
        url: '/sync',
        method: 'POST',
      }),
      invalidatesTags: ['Plugin', 'PluginStats'],
    }),
  }),
});

export const {
  // Discovery hooks
  useDiscoverPluginsQuery,
  useSearchPluginsQuery,
  useGetPluginDetailsQuery,
  useLazySearchPluginsQuery,

  // Installation hooks
  useInstallPluginMutation,
  useUninstallPluginMutation,
  useUpdatePluginMutation,

  // Management hooks
  useGetInstalledPluginsQuery,
  useTogglePluginMutation,
  useConfigurePluginMutation,

  // Update hooks
  useCheckPluginUpdatesQuery,
  useLazyCheckPluginUpdatesQuery,

  // Health monitoring hooks
  useGetPluginsHealthQuery,
  useRunPluginHealthCheckMutation,

  // Statistics hooks
  useGetPluginStoreStatsQuery,

  // Sync hooks
  useSyncMarketplaceMutation,
} = pluginApi;
