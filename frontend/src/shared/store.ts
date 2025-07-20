import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import chatReducer from "../core/chat/chat/chatSlice";
import { chatApi } from "../core/chat/chat/chatApi";
import { sessionsApi } from "../core/chat/chat/sessionsApi";
import websocketReducer from "../core/chat/chat/websocketSlice";
import routerTraceReducer from "../core/routing/routerTrace/routerTraceSlice";
import autoRoutingReducer from "../core/routing/autoRoutingSlice";
import { routerAnalyticsApi } from "../core/routing/router/routerAnalyticsApi";
import { modelsApi } from "../core/models/modelsApi";
import { pluginApi } from "../core/plugins/pluginApi";
import strategyReducer from "../core/strategySlice";
import agentHubReducer from "../features/agentHub/agentHubSlice";
import { agentApi } from "../features/agentHub/api/agentApi";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  department: string;
  storeId?: string;
}

export interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-reply';
  status: 'sending' | 'sent' | 'error';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  loading: boolean;
  
  // User State
  user: User | null;
  isAuthenticated: boolean;
  
  // Chat State
  conversations: Conversation[];
  activeConversationId: string | null;
  isTyping: boolean;
  
  // Widget State
  widgetOpen: boolean;
  widgetPosition: { x: number; y: number };
  
  // Error State
  error: string | null;
  
  // Performance
  lastActivity: Date;
  connectionStatus: 'online' | 'offline' | 'connecting';
}

const initialState: AppState = {
  theme: 'auto',
  sidebarOpen: false,
  loading: false,
  user: null,
  isAuthenticated: false,
  conversations: [],
  activeConversationId: null,
  isTyping: false,
  widgetOpen: false,
  widgetPosition: { x: 20, y: 20 },
  error: null,
  lastActivity: new Date(),
  connectionStatus: 'online',
};

// App Slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // UI Actions
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // User Actions
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.conversations = [];
      state.activeConversationId = null;
    },
    
    // Chat Actions
    addConversation: (state, action: PayloadAction<Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const conversation: Conversation = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.conversations.unshift(conversation);
      state.activeConversationId = conversation.id;
    },
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Omit<Message, 'id' | 'timestamp'> }>) => {
      const { conversationId, message } = action.payload;
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        const newMessage: Message = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
          status: message.from === 'user' ? 'sending' : 'sent',
        };
        conversation.messages.push(newMessage);
        conversation.updatedAt = new Date();
      }
    },
    updateMessageStatus: (state, action: PayloadAction<{ conversationId: string; messageId: string; status: Message['status'] }>) => {
      const { conversationId, messageId, status } = action.payload;
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
          message.status = status;
        }
      }
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    clearConversations: (state) => {
      state.conversations = [];
      state.activeConversationId = null;
    },
    
    // Widget Actions
    setWidgetOpen: (state, action: PayloadAction<boolean>) => {
      state.widgetOpen = action.payload;
    },
    setWidgetPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.widgetPosition = action.payload;
    },
    
    // Error Actions
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Performance Actions
    updateLastActivity: (state) => {
      state.lastActivity = new Date();
    },
    setConnectionStatus: (state, action: PayloadAction<'online' | 'offline' | 'connecting'>) => {
      state.connectionStatus = action.payload;
    },
  },
});

// Store configuration
export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    chat: chatReducer,
    websocket: websocketReducer,
    routerTrace: routerTraceReducer,
    autoRouting: autoRoutingReducer,
    strategy: strategyReducer,
    agentHub: agentHubReducer,
    // Add the generated reducer as a specific top-level slice
    [chatApi.reducerPath]: chatApi.reducer,
    [sessionsApi.reducerPath]: sessionsApi.reducer,
    [modelsApi.reducerPath]: modelsApi.reducer,
    [routerAnalyticsApi.reducerPath]: routerAnalyticsApi.reducer,
    [pluginApi.reducerPath]: pluginApi.reducer,
    [agentApi.reducerPath]: agentApi.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: [
          'app.lastActivity', 
          'app.conversations.*.messages.*.timestamp', 
          'app.conversations.*.createdAt', 
          'app.conversations.*.updatedAt', 
          'websocket.streamBuffer',
          'routerTrace.traces.*.timestamp',
          'routerTrace.traces.*.steps.*.timestamp'
        ],
      },
    }).concat(chatApi.middleware, sessionsApi.middleware, modelsApi.middleware, routerAnalyticsApi.middleware, pluginApi.middleware, agentApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Actions
export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setUser,
  logout,
  addConversation,
  setActiveConversation,
  addMessage,
  updateMessageStatus,
  setTyping,
  clearConversations,
  setWidgetOpen,
  setWidgetPosition,
  setError,
  clearError,
  updateLastActivity,
  setConnectionStatus,
} = appSlice.actions;

// Selectors
export const selectTheme = (state: RootState) => state.app.theme;
export const selectSidebarOpen = (state: RootState) => state.app.sidebarOpen;
export const selectLoading = (state: RootState) => state.app.loading;
export const selectUser = (state: RootState) => state.app.user;
export const selectIsAuthenticated = (state: RootState) => state.app.isAuthenticated;
export const selectConversations = (state: RootState) => state.app.conversations;
export const selectActiveConversation = (state: RootState) => {
  const activeId = state.app.activeConversationId;
  return activeId ? state.app.conversations.find(c => c.id === activeId) : null;
};
export const selectIsTyping = (state: RootState) => state.app.isTyping;
export const selectWidgetOpen = (state: RootState) => state.app.widgetOpen;
export const selectWidgetPosition = (state: RootState) => state.app.widgetPosition;
export const selectError = (state: RootState) => state.app.error;
export const selectConnectionStatus = (state: RootState) => state.app.connectionStatus;

export default store;
