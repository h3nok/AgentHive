import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  connectRouterTrace,
  disconnectRouterTrace,
  selectRouterTraceState,
  selectFilteredTraces,
  selectActiveTrace,
  selectTraceStats,
  toggleDrawer,
  openDrawer,
  closeDrawer,
  setActiveTrace,
  clearTraces,
  updateFilters,
  updateSettings,
  RouterTrace,
} from '../features/routerTrace/routerTraceSlice';

export interface UseRouterTraceReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Trace data
  traces: RouterTrace[];
  activeTrace: RouterTrace | null;
  stats: ReturnType<typeof selectTraceStats>;
  
  // Drawer state
  isDrawerOpen: boolean;
  
  // Actions
  connect: (sessionId: string) => void;
  disconnect: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setActiveTrace: (traceId: string | null) => void;
  clearTraces: () => void;
  updateFilters: (filters: Parameters<typeof updateFilters>[0]) => void;
  updateSettings: (settings: Parameters<typeof updateSettings>[0]) => void;
  
  // State
  filters: ReturnType<typeof selectRouterTraceState>['filters'];
  settings: ReturnType<typeof selectRouterTraceState>['settings'];
}

/**
 * Custom hook for managing router trace functionality
 * 
 * Provides easy access to router trace state and actions,
 * handling WebSocket connections and data management.
 */
export const useRouterTrace = (sessionId?: string): UseRouterTraceReturn => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const routerTraceState = useAppSelector(selectRouterTraceState);
  const filteredTraces = useAppSelector(selectFilteredTraces);
  const activeTrace = useAppSelector(selectActiveTrace);
  const stats = useAppSelector(selectTraceStats);
  
  // Actions
  const connect = useCallback((sessionId: string) => {
    dispatch(connectRouterTrace(sessionId));
  }, [dispatch]);
  
  const disconnect = useCallback(() => {
    dispatch(disconnectRouterTrace());
  }, [dispatch]);
  
  const handleToggleDrawer = useCallback(() => {
    dispatch(toggleDrawer());
  }, [dispatch]);
  
  const handleOpenDrawer = useCallback(() => {
    dispatch(openDrawer());
  }, [dispatch]);
  
  const handleCloseDrawer = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);
  
  const handleSetActiveTrace = useCallback((traceId: string | null) => {
    dispatch(setActiveTrace(traceId));
  }, [dispatch]);
  
  const handleClearTraces = useCallback(() => {
    dispatch(clearTraces());
  }, [dispatch]);
  
  const handleUpdateFilters = useCallback((filters: Parameters<typeof updateFilters>[0]) => {
    dispatch(updateFilters(filters));
  }, [dispatch]);
  
  const handleUpdateSettings = useCallback((settings: Parameters<typeof updateSettings>[0]) => {
    dispatch(updateSettings(settings));
  }, [dispatch]);
  
  // Auto-connect when sessionId changes
  useEffect(() => {
    if (sessionId && routerTraceState.settings.enableLiveUpdates) {
      connect(sessionId);
    }
    
    return () => {
      if (routerTraceState.isConnected) {
        disconnect();
      }
    };
  }, [sessionId, routerTraceState.settings.enableLiveUpdates]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (routerTraceState.isConnected) {
        disconnect();
      }
    };
  }, []);
  
  return {
    // Connection state
    isConnected: routerTraceState.isConnected,
    isConnecting: routerTraceState.isConnecting,
    error: routerTraceState.error,
    
    // Trace data
    traces: filteredTraces,
    activeTrace,
    stats,
    
    // Drawer state
    isDrawerOpen: routerTraceState.isDrawerOpen,
    
    // Actions
    connect,
    disconnect,
    toggleDrawer: handleToggleDrawer,
    openDrawer: handleOpenDrawer,
    closeDrawer: handleCloseDrawer,
    setActiveTrace: handleSetActiveTrace,
    clearTraces: handleClearTraces,
    updateFilters: handleUpdateFilters,
    updateSettings: handleUpdateSettings,
    
    // State
    filters: routerTraceState.filters,
    settings: routerTraceState.settings,
  };
};
