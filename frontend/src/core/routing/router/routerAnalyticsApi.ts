import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types for router analytics
export interface RouterMetrics {
  router_type: string;
  total_requests: number;
  uptime: string;
  version: string;
  enhanced_routing: boolean;
  learning_metrics?: {
    total_decisions: number;
    recent_decisions: number;
    success_rate: number;
    learning_enabled: boolean;
    agent_distribution: Record<string, number>;
    node_performance: Record<string, any>;
  };
  context_metrics?: {
    avg_user_satisfaction: number;
    active_sessions: number;
    avg_conversation_length: number;
    agent_preferences: Record<string, number>;
    active_users: number;
  };
}

export interface FeedbackRequest {
  decision_id: string;
  feedback_type: 'user_satisfaction' | 'agent_success' | 'resolution_time' | 'escalation';
  feedback_value: any;
  session_id?: string;
}

export interface SatisfactionRequest {
  agent_type: string;
  satisfaction_score: number;
  session_id?: string;
  comment?: string;
}

export interface DashboardAnalytics {
  time_range: string;
  generated_at: string;
  summary: {
    total_decisions: number;
    recent_decisions: number;
    success_rate: number;
    avg_satisfaction: number;
    active_sessions: number;
    learning_enabled: boolean;
  };
  agent_distribution: Record<string, number>;
  node_performance: Record<string, any>;
  context_insights: {
    avg_conversation_length: number;
    agent_preferences: Record<string, number>;
    active_users: number;
  };
}

export const routerAnalyticsApi = createApi({
  reducerPath: 'routerAnalyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/router',
    prepareHeaders: (headers) => {
      // Add auth headers if needed
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['RouterMetrics', 'Analytics'],
  endpoints: (builder) => ({
    // Get router performance metrics
    getRouterMetrics: builder.query<RouterMetrics, void>({
      query: () => '/metrics',
      providesTags: ['RouterMetrics'],
    }),

    // Record routing feedback
    recordFeedback: builder.mutation<{ status: string; message: string; decision_id: string }, FeedbackRequest>({
      query: (feedback) => ({
        url: '/feedback',
        method: 'POST',
        body: feedback,
      }),
      invalidatesTags: ['RouterMetrics', 'Analytics'],
    }),

    // Record user satisfaction
    recordSatisfaction: builder.mutation<{ status: string; message: string; agent_type: string; score: number }, SatisfactionRequest>({
      query: (satisfaction) => ({
        url: '/satisfaction',
        method: 'POST',
        body: satisfaction,
      }),
      invalidatesTags: ['RouterMetrics', 'Analytics'],
    }),

    // Get dashboard analytics
    getDashboardAnalytics: builder.query<DashboardAnalytics, { timeRange?: string }>({
      query: ({ timeRange = '24h' } = {}) => ({
        url: '/analytics/dashboard',
        params: { time_range: timeRange },
      }),
      providesTags: ['Analytics'],
    }),

    // Export learning data
    exportLearningData: builder.query<Blob, { format?: 'json' | 'csv' }>({
      query: ({ format = 'json' } = {}) => ({
        url: '/learning/export',
        params: { export_format: format },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetRouterMetricsQuery,
  useRecordFeedbackMutation,
  useRecordSatisfactionMutation,
  useGetDashboardAnalyticsQuery,
  useLazyExportLearningDataQuery,
} = routerAnalyticsApi;

// Alias for backward compatibility
export const useSubmitFeedbackMutation = useRecordFeedbackMutation;
