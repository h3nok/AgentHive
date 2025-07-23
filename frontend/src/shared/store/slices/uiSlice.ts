/**
 * Consolidated UI State Management
 * Replaces scattered UI state across multiple slices
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// UI State Types
export interface UIState {
  // Theme & Layout
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Loading States (centralized)
  loading: {
    global: boolean;
    chat: boolean;
    agents: boolean;
    sessions: boolean;
    workflows: boolean;
  };
  
  // Error States (centralized)
  errors: {
    global: string | null;
    chat: string | null;
    agents: string | null;
    sessions: string | null;
    workflows: string | null;
  };
  
  // Modal & Dialog States
  modals: {
    agentSelector: boolean;
    sessionSettings: boolean;
    workflowEditor: boolean;
    userProfile: boolean;
  };
  
  // Chat UI State
  chat: {
    isTyping: boolean;
    streamingMessageId: string | null;
    showSystemMessages: boolean;
    compactMode: boolean;
  };
  
  // Agent Hub UI State
  agentHub: {
    searchTerm: string;
    viewMode: 'grid' | 'list';
    selectedCategory: string | null;
    sortBy: 'name' | 'updated' | 'popularity';
    sortOrder: 'asc' | 'desc';
  };
  
  // Router & Analytics UI State
  router: {
    showTrace: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    selectedTraceId: string | null;
  };
  
  // Widget State
  widget: {
    open: boolean;
    position: { x: number; y: number };
    minimized: boolean;
  };
  
  // Performance Tracking
  performance: {
    lastActivity: string;
    renderCount: number;
    slowComponents: string[];
  };
}

const initialState: UIState = {
  // Theme & Layout
  theme: 'auto',
  sidebarOpen: true,
  sidebarCollapsed: false,
  
  // Loading States
  loading: {
    global: false,
    chat: false,
    agents: false,
    sessions: false,
    workflows: false,
  },
  
  // Error States
  errors: {
    global: null,
    chat: null,
    agents: null,
    sessions: null,
    workflows: null,
  },
  
  // Modal States
  modals: {
    agentSelector: false,
    sessionSettings: false,
    workflowEditor: false,
    userProfile: false,
  },
  
  // Chat UI
  chat: {
    isTyping: false,
    streamingMessageId: null,
    showSystemMessages: true,
    compactMode: false,
  },
  
  // Agent Hub UI
  agentHub: {
    searchTerm: '',
    viewMode: 'grid',
    selectedCategory: null,
    sortBy: 'name',
    sortOrder: 'asc',
  },
  
  // Router UI
  router: {
    showTrace: false,
    autoRefresh: true,
    refreshInterval: 5000,
    selectedTraceId: null,
  },
  
  // Widget
  widget: {
    open: false,
    position: { x: 20, y: 20 },
    minimized: false,
  },
  
  // Performance
  performance: {
    lastActivity: new Date().toISOString(),
    renderCount: 0,
    slowComponents: [],
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme & Layout Actions
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    // Loading Actions (centralized)
    setLoading: (state, action: PayloadAction<{ key: keyof UIState['loading']; value: boolean }>) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    // Error Actions (centralized)
    setError: (state, action: PayloadAction<{ key: keyof UIState['errors']; value: string | null }>) => {
      const { key, value } = action.payload;
      state.errors[key] = value;
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.errors.global = action.payload;
    },
    clearAllErrors: (state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key as keyof UIState['errors']] = null;
      });
    },
    
    // Modal Actions
    setModal: (state, action: PayloadAction<{ key: keyof UIState['modals']; value: boolean }>) => {
      const { key, value } = action.payload;
      state.modals[key] = value;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    
    // Chat UI Actions
    setChatTyping: (state, action: PayloadAction<boolean>) => {
      state.chat.isTyping = action.payload;
    },
    setStreamingMessage: (state, action: PayloadAction<string | null>) => {
      state.chat.streamingMessageId = action.payload;
    },
    setChatCompactMode: (state, action: PayloadAction<boolean>) => {
      state.chat.compactMode = action.payload;
    },
    toggleSystemMessages: (state) => {
      state.chat.showSystemMessages = !state.chat.showSystemMessages;
    },
    
    // Agent Hub UI Actions
    setAgentHubSearch: (state, action: PayloadAction<string>) => {
      state.agentHub.searchTerm = action.payload;
    },
    setAgentHubViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.agentHub.viewMode = action.payload;
    },
    setAgentHubCategory: (state, action: PayloadAction<string | null>) => {
      state.agentHub.selectedCategory = action.payload;
    },
    setAgentHubSort: (state, action: PayloadAction<{ 
      sortBy: UIState['agentHub']['sortBy']; 
      sortOrder: UIState['agentHub']['sortOrder']; 
    }>) => {
      state.agentHub.sortBy = action.payload.sortBy;
      state.agentHub.sortOrder = action.payload.sortOrder;
    },
    
    // Router UI Actions
    setRouterTrace: (state, action: PayloadAction<boolean>) => {
      state.router.showTrace = action.payload;
    },
    setRouterAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.router.autoRefresh = action.payload;
    },
    setRouterRefreshInterval: (state, action: PayloadAction<number>) => {
      state.router.refreshInterval = action.payload;
    },
    setSelectedTrace: (state, action: PayloadAction<string | null>) => {
      state.router.selectedTraceId = action.payload;
    },
    
    // Widget Actions
    setWidgetOpen: (state, action: PayloadAction<boolean>) => {
      state.widget.open = action.payload;
    },
    setWidgetPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.widget.position = action.payload;
    },
    setWidgetMinimized: (state, action: PayloadAction<boolean>) => {
      state.widget.minimized = action.payload;
    },
    
    // Performance Actions
    updateLastActivity: (state) => {
      state.performance.lastActivity = new Date().toISOString();
    },
    incrementRenderCount: (state) => {
      state.performance.renderCount += 1;
    },
    addSlowComponent: (state, action: PayloadAction<string>) => {
      if (!state.performance.slowComponents.includes(action.payload)) {
        state.performance.slowComponents.push(action.payload);
      }
    },
    clearSlowComponents: (state) => {
      state.performance.slowComponents = [];
    },
    
    // Bulk Reset
    resetUIState: (state) => {
      return { ...initialState, theme: state.theme }; // Preserve theme preference
    },
  },
});

// Export actions
export const {
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
  updateLastActivity,
  incrementRenderCount,
  addSlowComponent,
  clearSlowComponents,
  resetUIState,
} = uiSlice.actions;

// Export selectors
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectGlobalLoading = (state: RootState) => state.ui.loading.global;
export const selectGlobalError = (state: RootState) => state.ui.errors.global;
export const selectChatTyping = (state: RootState) => state.ui.chat.isTyping;
export const selectStreamingMessage = (state: RootState) => state.ui.chat.streamingMessageId;
export const selectAgentHubState = (state: RootState) => state.ui.agentHub;
export const selectRouterState = (state: RootState) => state.ui.router;
export const selectWidgetState = (state: RootState) => state.ui.widget;
export const selectPerformanceState = (state: RootState) => state.ui.performance;

// Computed selectors
export const selectHasErrors = (state: RootState) => 
  Object.values(state.ui.errors).some(error => error !== null);

export const selectIsLoading = (state: RootState) =>
  Object.values(state.ui.loading).some(loading => loading);

export const selectOpenModals = (state: RootState) =>
  Object.entries(state.ui.modals)
    .filter(([_, isOpen]) => isOpen)
    .map(([key]) => key);

export default uiSlice.reducer;
