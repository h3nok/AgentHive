/**
 * Consolidated Redux Store Architecture
 * Sprint 4: State Management Consolidation
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Entity Adapters & Normalized State
import entitiesReducer from './slices/entitiesSlice';
import uiReducer from './slices/uiSlice';
import connectionReducer from './slices/connectionSlice';

// RTK Query APIs (consolidated)
import { apiSlice } from './api/apiSlice';
import { chatApi } from '../../core/chat/chat/chatApi';

// Store configuration with consolidated reducers
export const store = configureStore({
  reducer: {
    // Normalized entity storage
    entities: entitiesReducer,
    
    // UI state management
    ui: uiReducer,
    
    // Connection & WebSocket management
    connection: connectionReducer,
    
    // Unified API layer
    [apiSlice.reducerPath]: apiSlice.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [apiSlice.util.resetApiState.type],
        ignoredPaths: ['connection.lastActivity'],
      },
    }).concat(apiSlice.middleware, chatApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Inferred types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
