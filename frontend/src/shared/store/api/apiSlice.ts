/**
 * Unified API Layer - RTK Query Consolidation
 * Replaces fragmented API handling across multiple files
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Base API configuration
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      
      // Add auth token if available
      const user = state.entities.users.entities[state.entities.activeUserId || ''];
      if (user) {
        headers.set('authorization', `Bearer ${user.id}`);
      }
      
      // Add content type
      headers.set('content-type', 'application/json');
      
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Agent', 
    'Session',
    'Message',
    'Workflow',
    'Plugin',
    'Model',
    'RouterAnalytics',
    'Strategy',
  ],
  endpoints: (builder) => ({
    // User endpoints
    getCurrentUser: builder.query<any, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    
    // Agent endpoints
    getAgents: builder.query<any[], void>({
      query: () => '/agents',
      providesTags: ['Agent'],
    }),
    getAgentById: builder.query<any, string>({
      query: (id) => `/agents/${id}`,
      providesTags: (result, error, id) => [{ type: 'Agent', id }],
    }),
    createAgent: builder.mutation<any, Partial<any>>({
      query: (agent) => ({
        url: '/agents',
        method: 'POST',
        body: agent,
      }),
      invalidatesTags: ['Agent'],
    }),
    updateAgent: builder.mutation<any, { id: string; changes: Partial<any> }>({
      query: ({ id, changes }) => ({
        url: `/agents/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Agent', id }],
    }),
    
    // Session endpoints
    getSessions: builder.query<any[], void>({
      query: () => '/sessions',
      providesTags: ['Session'],
    }),
    getSessionById: builder.query<any, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Session', id }],
    }),
    createSession: builder.mutation<any, { title?: string; agentId?: string }>({
      query: (session) => ({
        url: '/sessions',
        method: 'POST',
        body: session,
      }),
      invalidatesTags: ['Session'],
    }),
    updateSession: builder.mutation<any, { id: string; changes: Partial<any> }>({
      query: ({ id, changes }) => ({
        url: `/sessions/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Session', id }],
    }),
    deleteSession: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Session'],
    }),
    
    // Message endpoints
    getSessionMessages: builder.query<any[], string>({
      query: (sessionId) => `/sessions/${sessionId}/messages`,
      providesTags: (result, error, sessionId) => [
        { type: 'Message', id: `session-${sessionId}` },
      ],
    }),
    sendMessage: builder.mutation<any, { 
      sessionId: string; 
      text: string; 
      agentId?: string;
    }>({
      query: ({ sessionId, text, agentId }) => ({
        url: `/sessions/${sessionId}/messages`,
        method: 'POST',
        body: { text, agentId },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: 'Message', id: `session-${sessionId}` },
      ],
    }),
    
    // Agent Query (intelligent routing)
    queryAgent: builder.mutation<any, {
      sessionId: string;
      query: string;
      context?: Record<string, any>;
    }>({
      query: ({ sessionId, query, context }) => ({
        url: '/agent/query',
        method: 'POST',
        body: { sessionId, query, context },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: 'Message', id: `session-${sessionId}` },
      ],
    }),
    
    // Workflow endpoints
    getWorkflows: builder.query<any[], void>({
      query: () => '/workflows',
      providesTags: ['Workflow'],
    }),
    createWorkflow: builder.mutation<any, {
      name: string;
      steps: any[];
      sessionId?: string;
    }>({
      query: (workflow) => ({
        url: '/workflows',
        method: 'POST',
        body: workflow,
      }),
      invalidatesTags: ['Workflow'],
    }),
    updateWorkflow: builder.mutation<any, { id: string; changes: Partial<any> }>({
      query: ({ id, changes }) => ({
        url: `/workflows/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Workflow', id }],
    }),
    
    // Plugin endpoints
    getPlugins: builder.query<any[], void>({
      query: () => '/plugins',
      providesTags: ['Plugin'],
    }),
    getPluginHealth: builder.query<any, void>({
      query: () => '/plugins/health',
      providesTags: ['Plugin'],
    }),
    installPlugin: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/plugins/${id}/install`,
        method: 'POST',
      }),
      invalidatesTags: ['Plugin'],
    }),
    uninstallPlugin: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/plugins/${id}/uninstall`,
        method: 'POST',
      }),
      invalidatesTags: ['Plugin'],
    }),
    
    // Model endpoints
    getModels: builder.query<any[], void>({
      query: () => '/models',
      providesTags: ['Model'],
    }),
    
    // Router Analytics endpoints
    getRouterAnalytics: builder.query<any, void>({
      query: () => '/router/analytics',
      providesTags: ['RouterAnalytics'],
    }),
    getRouterTrace: builder.query<any[], { limit?: number }>({
      query: ({ limit = 100 } = {}) => `/router/trace?limit=${limit}`,
      providesTags: ['RouterAnalytics'],
    }),
    
    // Strategy endpoints
    getRoutingStrategy: builder.query<any, void>({
      query: () => '/strategy',
      providesTags: ['Strategy'],
    }),
    updateRoutingStrategy: builder.mutation<any, any>({
      query: (strategy) => ({
        url: '/strategy',
        method: 'PUT',
        body: strategy,
      }),
      invalidatesTags: ['Strategy'],
    }),
  }),
});

// Export hooks for use in components
export const {
  // User hooks
  useGetCurrentUserQuery,
  
  // Agent hooks
  useGetAgentsQuery,
  useGetAgentByIdQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  
  // Session hooks
  useGetSessionsQuery,
  useGetSessionByIdQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  
  // Message hooks
  useGetSessionMessagesQuery,
  useSendMessageMutation,
  useQueryAgentMutation,
  
  // Workflow hooks
  useGetWorkflowsQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  
  // Plugin hooks
  useGetPluginsQuery,
  useGetPluginHealthQuery,
  useInstallPluginMutation,
  useUninstallPluginMutation,
  
  // Model hooks
  useGetModelsQuery,
  
  // Router Analytics hooks
  useGetRouterAnalyticsQuery,
  useGetRouterTraceQuery,
  
  // Strategy hooks
  useGetRoutingStrategyQuery,
  useUpdateRoutingStrategyMutation,
} = apiSlice;
