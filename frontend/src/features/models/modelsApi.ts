import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Default to same-origin when env var not provided – avoids CORS in k8s/ingress
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: string;
  capabilities: string[];
  context_length: number;
  is_available: boolean;
  is_default: boolean;
  pricing_tier: string;
  specialties: string[];
}

export interface ModelsResponse {
  models: ModelInfo[];
  default_model: string;
  total_count: number;
}

export interface ModelHealthCheck {
  status: string;
  total_models: number;
  available_models: number;
  providers: {
    azure: boolean;
    ollama: boolean;
    coretex: boolean;
  };
  current_provider: string;
  timestamp: string;
}

export const modelsApi = createApi({
  reducerPath: "modelsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/models`,
    prepareHeaders: async (headers) => {
      let token = localStorage.getItem('access_token');
      if (!token) {
        try {
          const { msalInstance } = await import('../../utils/msalInstance');
          const { loginRequest } = await import('../../utils/authConfig');
          const account = msalInstance.getActiveAccount();
          if (account) {
            const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
            token = result.accessToken;
          }
        } catch {
          // silent fail
        }
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Model"],
  endpoints: (builder) => ({
    listModels: builder.query<ModelsResponse, void>({
      query: () => ({
        url: "/",
        method: "GET",
      }),
      providesTags: [{ type: "Model", id: "LIST" }],
      transformResponse: (response: ModelsResponse) => {
        // Sort models by availability and default status
        const sortedModels = response.models.sort((a, b) => {
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          if (a.is_available && !b.is_available) return -1;
          if (!a.is_available && b.is_available) return 1;
          return a.name.localeCompare(b.name);
        });
        
        return {
          ...response,
          models: sortedModels
        };
      },
    }),
    getModelDetails: builder.query<ModelInfo, string>({
      query: (modelId) => ({
        url: `/${modelId}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Model", id }],
    }),
    getModelsHealth: builder.query<ModelHealthCheck, void>({
      query: () => ({
        url: "/health/check",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useListModelsQuery,
  useGetModelDetailsQuery,
  useGetModelsHealthQuery,
  useLazyListModelsQuery,
  useLazyGetModelDetailsQuery,
} = modelsApi;

// Selectors for common model operations
export const selectAvailableModels = (modelsResponse: ModelsResponse | undefined) => 
  modelsResponse?.models.filter(model => model.is_available) || [];

export const selectDefaultModel = (modelsResponse: ModelsResponse | undefined) => 
  modelsResponse?.models.find(model => model.is_default && model.is_available) || 
  modelsResponse?.models.find(model => model.is_available) ||
  null;

export const selectModelsByProvider = (modelsResponse: ModelsResponse | undefined, provider: string) =>
  modelsResponse?.models.filter(model => 
    model.provider.toLowerCase() === provider.toLowerCase() && model.is_available
  ) || [];

export const selectModelsByCapability = (modelsResponse: ModelsResponse | undefined, capability: string) =>
  modelsResponse?.models.filter(model => 
    model.capabilities.includes(capability) && model.is_available
  ) || [];

// Helper functions
export const getModelDisplayName = (model: ModelInfo): string => {
  const tierBadge = model.pricing_tier === 'premium' ? ' ⭐' : 
                   model.pricing_tier === 'free' ? ' 🆓' : '';
  return `${model.name}${tierBadge}`;
};

export const getModelStatusColor = (model: ModelInfo): 'success' | 'warning' | 'error' => {
  if (!model.is_available) return 'error';
  if (model.is_default) return 'success';
  return 'warning';
};

export const getModelDescription = (model: ModelInfo): string => {
  const contextInfo = model.context_length >= 100000 ? 
    ` • ${Math.round(model.context_length / 1000)}K context` : 
    ` • ${model.context_length} tokens`;
  
  const specialtiesInfo = model.specialties.length > 0 ? 
    ` • ${model.specialties.slice(0, 2).join(', ')}` : '';
    
  return `${model.description}${contextInfo}${specialtiesInfo}`;
}; 