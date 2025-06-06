import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRouterTrace } from '../../hooks/useRouterTrace';
import routerTraceReducer from '../../features/routerTrace/routerTraceSlice';

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      routerTrace: routerTraceReducer,
    },
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useRouterTrace', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useRouterTrace(), { wrapper });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.traces).toEqual([]);
    expect(result.current.activeTrace).toBe(null);
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it('should provide drawer control actions', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useRouterTrace(), { wrapper });

    expect(typeof result.current.toggleDrawer).toBe('function');
    expect(typeof result.current.openDrawer).toBe('function');
    expect(typeof result.current.closeDrawer).toBe('function');
  });

  it('should provide trace management actions', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useRouterTrace(), { wrapper });

    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.setActiveTrace).toBe('function');
    expect(typeof result.current.clearTraces).toBe('function');
  });

  it('should provide filter and settings actions', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useRouterTrace(), { wrapper });

    expect(typeof result.current.updateFilters).toBe('function');
    expect(typeof result.current.updateSettings).toBe('function');
    expect(result.current.filters).toBeDefined();
    expect(result.current.settings).toBeDefined();
  });

  it('should toggle drawer state', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useRouterTrace(), { wrapper });

    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      result.current.toggleDrawer();
    });

    expect(result.current.isDrawerOpen).toBe(true);
  });

  it('should connect when sessionId is provided and live updates are enabled', () => {
    const wrapper = createWrapper(store);
    const sessionId = 'test-session-123';

    renderHook(() => useRouterTrace(sessionId), { wrapper });

    // WebSocket constructor should have been called
    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining(`/v1/debug/router-trace/${sessionId}`)
    );
  });

  it('should not connect when live updates are disabled', async () => {
    const wrapper = createWrapper(store);
    
    // First disable live updates
    const { result } = renderHook(() => useRouterTrace(), { wrapper });
    
    act(() => {
      result.current.updateSettings({ enableLiveUpdates: false });
    });

    // Then try to provide sessionId
    const { result: result2 } = renderHook(() => useRouterTrace('test-session'), { wrapper });

    // Should not connect when live updates are disabled
    expect(result2.current.isConnecting).toBe(false);
  });

  it('should calculate stats correctly', () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useRouterTrace(), { wrapper });

    expect(result.current.stats).toBeDefined();
    expect(result.current.stats.totalTraces).toBe(0);
    expect(result.current.stats.avgLatency).toBe(0);
    expect(result.current.stats.avgConfidence).toBe(0);
    expect(result.current.stats.successRate).toBe(0);
  });
});
