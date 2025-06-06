import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';

// Router trace data structures
export interface RouterStep {
  id: string;
  timestamp: string;
  step: string;
  agent: string;
  confidence: number;
  intent: string;
  method: 'llm_router' | 'regex' | 'fallback';
  latency_ms: number;
  metadata?: Record<string, unknown>;
}

export interface RouterTrace {
  id: string;
  sessionId: string;
  query: string;
  timestamp: string;
  totalLatency: number;
  finalAgent: string;
  finalConfidence: number;
  steps: RouterStep[];
  success: boolean;
  error?: string;
}

interface RouterTraceState {
  traces: RouterTrace[];
  activeTrace: string | null;
  isDrawerOpen: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  filters: {
    agent: string | null;
    method: string | null;
    minConfidence: number;
    showErrors: boolean;
  };
  settings: {
    maxTraces: number;
    autoScroll: boolean;
    enableLiveUpdates: boolean;
  };
}

const initialState: RouterTraceState = {
  traces: [],
  activeTrace: null,
  isDrawerOpen: false,
  isConnected: false,
  isConnecting: false,
  error: null,
  filters: {
    agent: null,
    method: null,
    minConfidence: 0,
    showErrors: true,
  },
  settings: {
    maxTraces: 100,
    autoScroll: true,
    enableLiveUpdates: true,
  },
};

// WebSocket connection for live router trace data
let routerTraceWS: WebSocket | null = null;

export const connectRouterTrace = createAsyncThunk(
  'routerTrace/connect',
  async (sessionId: string, { dispatch }) => {
    if (routerTraceWS && routerTraceWS.readyState === WebSocket.OPEN) {
      routerTraceWS.close();
    }

    // Construct WebSocket URL based on environment
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
    let wsUrl: string;
    
    if (API_BASE_URL && API_BASE_URL.startsWith('http')) {
      // Development mode with explicit API URL
      const baseUrl = new URL(API_BASE_URL);
      const protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${baseUrl.host}/v1/debug/router-trace/${sessionId}`;
    } else {
      // Production mode - same origin
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/v1/debug/router-trace/${sessionId}`;
    }
    
    console.log('Connecting to router trace WebSocket:', wsUrl);
    routerTraceWS = new WebSocket(wsUrl);

    routerTraceWS.onopen = () => {
      console.log('Router trace WebSocket connected');
      dispatch(routerTraceConnected());
    };

    routerTraceWS.onmessage = (event) => {
      try {
        // Skip non-JSON messages (like ping/pong)
        if (typeof event.data !== 'string' || event.data.trim() === '' || !event.data.startsWith('{')) {
          console.log('Skipping non-JSON WebSocket message:', event.data);
          return;
        }
        
        const data = JSON.parse(event.data);
        console.log('Router trace received:', data);
        
        // Validate that this looks like a router trace message
        if (data && typeof data === 'object' && data.id && data.sessionId) {
          dispatch(routerTraceReceived(data));
        } else {
          console.log('Skipping non-router-trace message:', data);
        }
      } catch (error) {
        console.warn('Failed to parse router trace data:', error, 'Raw data:', event.data);
      }
    };

    routerTraceWS.onerror = (error) => {
      console.error('Router trace WebSocket error:', error);
      dispatch(routerTraceError('WebSocket connection error'));
    };

    routerTraceWS.onclose = (event) => {
      console.log('Router trace WebSocket closed:', event.code, event.reason);
      dispatch(routerTraceDisconnected());
    };

    return sessionId;
  }
);

export const disconnectRouterTrace = createAsyncThunk(
  'routerTrace/disconnect',
  async (_, { dispatch }) => {
    if (routerTraceWS) {
      routerTraceWS.close();
      routerTraceWS = null;
    }
    dispatch(routerTraceDisconnected());
  }
);

const routerTraceSlice = createSlice({
  name: 'routerTrace',
  initialState,
  reducers: {
    routerTraceConnected: (state) => {
      state.isConnected = true;
      state.isConnecting = false;
      state.error = null;
    },
    routerTraceDisconnected: (state) => {
      state.isConnected = false;
      state.isConnecting = false;
    },
    routerTraceError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isConnecting = false;
      state.isConnected = false;
    },
    routerTraceReceived: (state, action: PayloadAction<RouterTrace>) => {
      const trace = action.payload;
      
      // Add new trace
      state.traces.unshift(trace);
      
      // Limit traces to maxTraces
      if (state.traces.length > state.settings.maxTraces) {
        state.traces = state.traces.slice(0, state.settings.maxTraces);
      }
      
      // Set as active trace if drawer is open
      if (state.isDrawerOpen && state.settings.autoScroll) {
        state.activeTrace = trace.id;
      }
    },
    addTrace: (state, action: PayloadAction<RouterTrace>) => {
      const trace = action.payload;
      
      // Add new trace manually (for simulation)
      state.traces.unshift(trace);
      
      // Limit traces to maxTraces
      if (state.traces.length > state.settings.maxTraces) {
        state.traces = state.traces.slice(0, state.settings.maxTraces);
      }
      
      // Set as active trace if drawer is open
      if (state.isDrawerOpen && state.settings.autoScroll) {
        state.activeTrace = trace.id;
      }
    },
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    openDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    closeDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    setActiveTrace: (state, action: PayloadAction<string | null>) => {
      state.activeTrace = action.payload;
    },
    clearTraces: (state) => {
      state.traces = [];
      state.activeTrace = null;
    },
    updateFilters: (state, action: PayloadAction<Partial<RouterTraceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateSettings: (state, action: PayloadAction<Partial<RouterTraceState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectRouterTrace.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(connectRouterTrace.fulfilled, () => {
        // Connection will be handled by onopen callback
      })
      .addCase(connectRouterTrace.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.error.message || 'Failed to connect to router trace';
      });
  },
});

// Selectors
export const selectRouterTraceState = (state: RootState) => state.routerTrace;

export const selectFilteredTraces = (state: RootState) => {
  const { traces, filters } = state.routerTrace;
  
  return traces.filter(trace => {
    // Filter by agent
    if (filters.agent && trace.finalAgent !== filters.agent) {
      return false;
    }
    
    // Filter by method
    if (filters.method) {
      const hasMethod = trace.steps.some(step => step.method === filters.method);
      if (!hasMethod) return false;
    }
    
    // Filter by confidence
    if (trace.finalConfidence < filters.minConfidence) {
      return false;
    }
    
    // Filter by errors
    if (!filters.showErrors && !trace.success) {
      return false;
    }
    
    return true;
  });
};

export const selectActiveTrace = (state: RootState) => {
  const { traces, activeTrace } = state.routerTrace;
  return traces.find(trace => trace.id === activeTrace) || null;
};

export const selectTraceStats = (state: RootState) => {
  const traces = selectFilteredTraces(state);
  
  if (traces.length === 0) {
    return {
      totalTraces: 0,
      avgLatency: 0,
      avgConfidence: 0,
      successRate: 0,
      agentDistribution: {},
      methodDistribution: {},
    };
  }
  
  const avgLatency = traces.reduce((sum, trace) => sum + trace.totalLatency, 0) / traces.length;
  const avgConfidence = traces.reduce((sum, trace) => sum + trace.finalConfidence, 0) / traces.length;
  const successRate = traces.filter(trace => trace.success).length / traces.length * 100;
  
  const agentDistribution = traces.reduce((acc, trace) => {
    acc[trace.finalAgent] = (acc[trace.finalAgent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const methodDistribution = traces.reduce((acc, trace) => {
    if (trace.steps && Array.isArray(trace.steps)) {
      trace.steps.forEach(step => {
        acc[step.method] = (acc[step.method] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalTraces: traces.length,
    avgLatency: Math.round(avgLatency * 100) / 100,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    successRate: Math.round(successRate * 100) / 100,
    agentDistribution,
    methodDistribution,
  };
};

export const {
  routerTraceConnected,
  routerTraceDisconnected,
  routerTraceError,
  routerTraceReceived,
  addTrace,
  toggleDrawer,
  openDrawer,
  closeDrawer,
  setActiveTrace,
  clearTraces,
  updateFilters,
  updateSettings,
} = routerTraceSlice.actions;

export default routerTraceSlice.reducer;
