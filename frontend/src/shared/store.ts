/**
 * Consolidated Redux Store - Sprint 4 State Management
 * Replaces fragmented state management with unified architecture
 */

// Export consolidated store architecture
export { store, useAppDispatch, useAppSelector } from './store/index';
export type { RootState, AppDispatch } from './store/index';

// Export entity management
export * from './store/slices/entitiesSlice';
export * from './store/slices/connectionSlice';
export * from './store/api/apiSlice';

// Export UI slice with explicit re-exports to avoid naming conflicts
export {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setSidebarCollapsed,
  setLoading,
  setGlobalLoading,
  setError,
  setGlobalError,
  clearAllErrors,
  setModal,
  closeAllModals,
  setChatTyping,
  setStreamingMessage,
  setChatCompactMode,
  toggleSystemMessages,
  setAgentHubSearch,
  setAgentHubViewMode,
  setAgentHubCategory,
  setAgentHubSort,
  setRouterTrace,
  setRouterAutoRefresh,
  setRouterRefreshInterval,
  setSelectedTrace,
  setWidgetOpen,
  setWidgetPosition,
  setWidgetMinimized,
  updateLastActivity as updateUILastActivity,
  incrementRenderCount,
  addSlowComponent,
  clearSlowComponents,
  resetUIState
} from './store/slices/uiSlice';

// Note: Selectors are available through the consolidated store hooks

// Legacy compatibility exports (will be removed after migration)
export { store as default } from './store/index';
