import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import routerTraceReducer, {
  routerTraceConnected,
  routerTraceDisconnected,
  routerTraceReceived,
  toggleDrawer,
  setActiveTrace,
  clearTraces,
  updateFilters,
  updateSettings,
  selectFilteredTraces,
  selectTraceStats,
  RouterTrace,
} from '../../features/routerTrace/routerTraceSlice';

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      routerTrace: routerTraceReducer,
    },
    preloadedState: {
      routerTrace: {
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
        ...initialState,
      },
    },
  });
};

// Mock router trace data
const mockTrace: RouterTrace = {
  id: 'trace-1',
  sessionId: 'session-1',
  query: 'What is my lease balance?',
  timestamp: '2024-01-01T10:00:00Z',
  totalLatency: 150.5,
  finalAgent: 'lease',
  finalConfidence: 0.95,
  success: true,
  steps: [
    {
      id: 'step-1',
      timestamp: '2024-01-01T10:00:00Z',
      step: 'intent_classification',
      agent: 'lease',
      confidence: 0.95,
      intent: 'lease_inquiry',
      method: 'llm_router',
      latency_ms: 150.5,
      metadata: {
        reasoning: 'Query contains lease-specific keywords',
      },
    },
  ],
};

const mockErrorTrace: RouterTrace = {
  id: 'trace-2',
  sessionId: 'session-1',
  query: 'Invalid query',
  timestamp: '2024-01-01T10:01:00Z',
  totalLatency: 50.0,
  finalAgent: 'general',
  finalConfidence: 0.3,
  success: false,
  error: 'Classification failed',
  steps: [
    {
      id: 'step-2',
      timestamp: '2024-01-01T10:01:00Z',
      step: 'fallback_classification',
      agent: 'general',
      confidence: 0.3,
      intent: 'unknown',
      method: 'fallback',
      latency_ms: 50.0,
    },
  ],
};

describe('routerTraceSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('connection actions', () => {
    it('should handle routerTraceConnected', () => {
      store.dispatch(routerTraceConnected());
      const state = store.getState().routerTrace;
      
      expect(state.isConnected).toBe(true);
      expect(state.isConnecting).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle routerTraceDisconnected', () => {
      store.dispatch(routerTraceDisconnected());
      const state = store.getState().routerTrace;
      
      expect(state.isConnected).toBe(false);
      expect(state.isConnecting).toBe(false);
    });
  });

  describe('drawer actions', () => {
    it('should toggle drawer state', () => {
      expect(store.getState().routerTrace.isDrawerOpen).toBe(false);
      
      store.dispatch(toggleDrawer());
      expect(store.getState().routerTrace.isDrawerOpen).toBe(true);
      
      store.dispatch(toggleDrawer());
      expect(store.getState().routerTrace.isDrawerOpen).toBe(false);
    });
  });

  describe('trace management', () => {
    it('should add trace to the beginning of the list', () => {
      store.dispatch(routerTraceReceived(mockTrace));
      const state = store.getState().routerTrace;
      
      expect(state.traces).toHaveLength(1);
      expect(state.traces[0]).toEqual(mockTrace);
    });

    it('should limit traces to maxTraces setting', () => {
      // Set max traces to 2
      store.dispatch(updateSettings({ maxTraces: 2 }));
      
      // Add 3 traces
      store.dispatch(routerTraceReceived({ ...mockTrace, id: 'trace-1' }));
      store.dispatch(routerTraceReceived({ ...mockTrace, id: 'trace-2' }));
      store.dispatch(routerTraceReceived({ ...mockTrace, id: 'trace-3' }));
      
      const state = store.getState().routerTrace;
      
      expect(state.traces).toHaveLength(2);
      expect(state.traces[0].id).toBe('trace-3'); // Most recent first
      expect(state.traces[1].id).toBe('trace-2');
    });

    it('should set active trace when drawer is open and autoScroll is enabled', () => {
      store.dispatch(toggleDrawer()); // Open drawer
      store.dispatch(routerTraceReceived(mockTrace));
      
      const state = store.getState().routerTrace;
      expect(state.activeTrace).toBe(mockTrace.id);
    });

    it('should clear all traces', () => {
      store.dispatch(routerTraceReceived(mockTrace));
      store.dispatch(setActiveTrace(mockTrace.id));
      
      store.dispatch(clearTraces());
      const state = store.getState().routerTrace;
      
      expect(state.traces).toHaveLength(0);
      expect(state.activeTrace).toBe(null);
    });
  });

  describe('filters', () => {
    beforeEach(() => {
      store.dispatch(routerTraceReceived(mockTrace));
      store.dispatch(routerTraceReceived(mockErrorTrace));
    });

    it('should filter by agent', () => {
      store.dispatch(updateFilters({ agent: 'lease' }));
      const filteredTraces = selectFilteredTraces(store.getState());
      
      expect(filteredTraces).toHaveLength(1);
      expect(filteredTraces[0].finalAgent).toBe('lease');
    });

    it('should filter by method', () => {
      store.dispatch(updateFilters({ method: 'llm_router' }));
      const filteredTraces = selectFilteredTraces(store.getState());
      
      expect(filteredTraces).toHaveLength(1);
      expect(filteredTraces[0].steps.some(step => step.method === 'llm_router')).toBe(true);
    });

    it('should filter by confidence', () => {
      store.dispatch(updateFilters({ minConfidence: 0.8 }));
      const filteredTraces = selectFilteredTraces(store.getState());
      
      expect(filteredTraces).toHaveLength(1);
      expect(filteredTraces[0].finalConfidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should filter out errors when showErrors is false', () => {
      store.dispatch(updateFilters({ showErrors: false }));
      const filteredTraces = selectFilteredTraces(store.getState());
      
      expect(filteredTraces).toHaveLength(1);
      expect(filteredTraces[0].success).toBe(true);
    });
  });

  describe('stats calculation', () => {
    beforeEach(() => {
      store.dispatch(routerTraceReceived(mockTrace));
      store.dispatch(routerTraceReceived(mockErrorTrace));
    });

    it('should calculate correct statistics', () => {
      const stats = selectTraceStats(store.getState());
      
      expect(stats.totalTraces).toBe(2);
      expect(stats.avgLatency).toBe(100.25); // (150.5 + 50) / 2
      expect(stats.avgConfidence).toBe(62.5); // (95 + 30) / 2
      expect(stats.successRate).toBe(50); // 1 success out of 2 traces
      expect(stats.agentDistribution).toEqual({
        lease: 1,
        general: 1,
      });
      expect(stats.methodDistribution).toEqual({
        llm_router: 1,
        fallback: 1,
      });
    });

    it('should return zero stats for empty trace list', () => {
      store.dispatch(clearTraces());
      const stats = selectTraceStats(store.getState());
      
      expect(stats.totalTraces).toBe(0);
      expect(stats.avgLatency).toBe(0);
      expect(stats.avgConfidence).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.agentDistribution).toEqual({});
      expect(stats.methodDistribution).toEqual({});
    });
  });

  describe('settings management', () => {
    it('should update settings', () => {
      store.dispatch(updateSettings({
        maxTraces: 50,
        autoScroll: false,
        enableLiveUpdates: false,
      }));
      
      const state = store.getState().routerTrace;
      
      expect(state.settings.maxTraces).toBe(50);
      expect(state.settings.autoScroll).toBe(false);
      expect(state.settings.enableLiveUpdates).toBe(false);
    });
  });
});
