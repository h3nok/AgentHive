import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Agent {
  id: string;
  name: string;
  type: 'orchestrator' | 'specialist' | 'assistant' | 'analyst';
  status: 'online' | 'offline' | 'busy' | 'error';
  capabilities: string[];
  cpu: number;
  memory: number;
  tasksCompleted: number;
  successRate: number;
  responseTime: number;
}

// RTK Query API slice for agents
export const agentApi = createApi({
  reducerPath: 'agentApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Agent'],
  endpoints: (builder) => ({
    getAgents: builder.query<Agent[], void>({
      query: () => '/agents',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Agent' as const, id })), { type: 'Agent', id: 'LIST' }]
          : [{ type: 'Agent', id: 'LIST' }],
    }),
    // Placeholder for future mutations
  }),
});

export const { useGetAgentsQuery } = agentApi;
