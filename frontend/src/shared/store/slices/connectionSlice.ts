/**
 * Consolidated Connection & WebSocket Management
 * Replaces fragmented WebSocket handling across multiple slices
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Connection Types
export interface WebSocketConnection {
  id: string;
  url: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface ConnectionState {
  // Network status
  online: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  // WebSocket connections (unified management)
  websockets: {
    chat: WebSocketConnection | null;
    routerTrace: WebSocketConnection | null;
    analytics: WebSocketConnection | null;
  };
  
  // Stream management
  activeStreams: {
    [messageId: string]: {
      buffer: string[];
      complete: boolean;
      error?: string;
    };
  };
  
  // Connection health
  lastActivity: string;
  pingInterval: number;
  latency: number;
  
  // Reconnection strategy
  reconnectStrategy: 'immediate' | 'exponential' | 'disabled';
  reconnectDelay: number;
  
  // Error tracking
  connectionErrors: Array<{
    id: string;
    type: 'websocket' | 'http' | 'network';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

const initialState: ConnectionState = {
  online: navigator.onLine,
  connectionQuality: 'excellent',
  
  websockets: {
    chat: null,
    routerTrace: null,
    analytics: null,
  },
  
  activeStreams: {},
  
  lastActivity: new Date().toISOString(),
  pingInterval: 30000, // 30 seconds
  latency: 0,
  
  reconnectStrategy: 'exponential',
  reconnectDelay: 1000,
  
  connectionErrors: [],
};

// Async thunks for WebSocket management
export const connectWebSocket = createAsyncThunk(
  'connection/connectWebSocket',
  async (params: { 
    type: keyof ConnectionState['websockets']; 
    url: string; 
    sessionId?: string; 
  }, { dispatch, getState }) => {
    const { type, url, sessionId } = params;
    const state = getState() as RootState;
    
    // Close existing connection if any
    const existingConnection = state.connection.websockets[type];
    if (existingConnection && existingConnection.status !== 'disconnected') {
      dispatch(disconnectWebSocket({ type }));
    }
    
    const connectionId = `${type}-${Date.now()}`;
    const connection: WebSocketConnection = {
      id: connectionId,
      url,
      status: 'connecting',
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
    };
    
    dispatch(setWebSocketConnection({ type, connection }));
    
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        dispatch(setWebSocketStatus({ 
          type, 
          status: 'connected', 
          lastConnected: new Date().toISOString() 
        }));
        dispatch(clearConnectionError({ type: 'websocket' }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          dispatch(handleWebSocketMessage({ type, data }));
        } catch (error) {
          console.error(`Error parsing WebSocket message for ${type}:`, error);
          dispatch(addConnectionError({
            type: 'websocket',
            message: `Invalid message format from ${type} WebSocket`,
          }));
        }
      };
      
      ws.onerror = (error) => {
        console.error(`WebSocket error for ${type}:`, error);
        dispatch(setWebSocketStatus({ type, status: 'error' }));
        dispatch(addConnectionError({
          type: 'websocket',
          message: `WebSocket connection error for ${type}`,
        }));
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket closed for ${type}:`, event.code, event.reason);
        dispatch(setWebSocketStatus({ type, status: 'disconnected' }));
        
        // Auto-reconnect logic
        const currentState = getState() as RootState;
        const currentConnection = currentState.connection.websockets[type];
        
        if (currentConnection && 
            currentConnection.reconnectAttempts < currentConnection.maxReconnectAttempts &&
            currentState.connection.reconnectStrategy !== 'disabled') {
          
          const delay = currentState.connection.reconnectStrategy === 'exponential'
            ? currentState.connection.reconnectDelay * Math.pow(2, currentConnection.reconnectAttempts)
            : currentState.connection.reconnectDelay;
          
          setTimeout(() => {
            dispatch(reconnectWebSocket({ type }));
          }, delay);
        }
      };
      
      // Store WebSocket reference for cleanup
      (window as any)[`ws_${type}`] = ws;
      
      return { type, connectionId };
    } catch (error) {
      dispatch(setWebSocketStatus({ type, status: 'error' }));
      dispatch(addConnectionError({
        type: 'websocket',
        message: `Failed to create WebSocket connection for ${type}`,
      }));
      throw error;
    }
  }
);

export const disconnectWebSocket = createAsyncThunk(
  'connection/disconnectWebSocket',
  async (params: { type: keyof ConnectionState['websockets'] }, { dispatch }) => {
    const { type } = params;
    
    const ws = (window as any)[`ws_${type}`];
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'User disconnected');
      }
      delete (window as any)[`ws_${type}`];
    }
    
    dispatch(setWebSocketConnection({ type, connection: null }));
    return { type };
  }
);

export const reconnectWebSocket = createAsyncThunk(
  'connection/reconnectWebSocket',
  async (params: { type: keyof ConnectionState['websockets'] }, { dispatch, getState }) => {
    const { type } = params;
    const state = getState() as RootState;
    const connection = state.connection.websockets[type];
    
    if (connection) {
      dispatch(incrementReconnectAttempts({ type }));
      return dispatch(connectWebSocket({ type, url: connection.url }));
    }
  }
);

// Connection slice
const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    // Network status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.online = action.payload;
      state.connectionQuality = action.payload ? 'excellent' : 'offline';
    },
    setConnectionQuality: (state, action: PayloadAction<ConnectionState['connectionQuality']>) => {
      state.connectionQuality = action.payload;
    },
    
    // WebSocket management
    setWebSocketConnection: (state, action: PayloadAction<{
      type: keyof ConnectionState['websockets'];
      connection: WebSocketConnection | null;
    }>) => {
      const { type, connection } = action.payload;
      state.websockets[type] = connection;
    },
    setWebSocketStatus: (state, action: PayloadAction<{
      type: keyof ConnectionState['websockets'];
      status: WebSocketConnection['status'];
      lastConnected?: string;
    }>) => {
      const { type, status, lastConnected } = action.payload;
      const connection = state.websockets[type];
      if (connection) {
        connection.status = status;
        if (lastConnected) {
          connection.lastConnected = lastConnected;
        }
      }
    },
    incrementReconnectAttempts: (state, action: PayloadAction<{
      type: keyof ConnectionState['websockets'];
    }>) => {
      const { type } = action.payload;
      const connection = state.websockets[type];
      if (connection) {
        connection.reconnectAttempts += 1;
      }
    },
    
    // Stream management
    handleWebSocketMessage: (state, action: PayloadAction<{
      type: keyof ConnectionState['websockets'];
      data: any;
    }>) => {
      const { type, data } = action.payload;
      
      // Handle streaming messages
      if (data.type === 'token' && data.messageId) {
        const messageId = data.messageId;
        if (!state.activeStreams[messageId]) {
          state.activeStreams[messageId] = {
            buffer: [],
            complete: false,
          };
        }
        state.activeStreams[messageId].buffer.push(data.content);
      } else if (data.type === 'end' && data.messageId) {
        const messageId = data.messageId;
        if (state.activeStreams[messageId]) {
          state.activeStreams[messageId].complete = true;
        }
      } else if (data.type === 'error' && data.messageId) {
        const messageId = data.messageId;
        if (state.activeStreams[messageId]) {
          state.activeStreams[messageId].error = data.content;
        }
      }
    },
    clearStream: (state, action: PayloadAction<string>) => {
      delete state.activeStreams[action.payload];
    },
    
    // Connection health
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    },
    setLatency: (state, action: PayloadAction<number>) => {
      state.latency = action.payload;
    },
    
    // Error management
    addConnectionError: (state, action: PayloadAction<{
      type: 'websocket' | 'http' | 'network';
      message: string;
    }>) => {
      const error = {
        id: `error-${Date.now()}`,
        type: action.payload.type,
        message: action.payload.message,
        timestamp: new Date().toISOString(),
        resolved: false,
      };
      state.connectionErrors.push(error);
      
      // Keep only last 50 errors
      if (state.connectionErrors.length > 50) {
        state.connectionErrors = state.connectionErrors.slice(-50);
      }
    },
    resolveConnectionError: (state, action: PayloadAction<string>) => {
      const error = state.connectionErrors.find(e => e.id === action.payload);
      if (error) {
        error.resolved = true;
      }
    },
    clearConnectionError: (state, action: PayloadAction<{ type: 'websocket' | 'http' | 'network' }>) => {
      state.connectionErrors = state.connectionErrors.filter(
        error => error.type !== action.payload.type || error.resolved
      );
    },
    
    // Cleanup
    cleanupConnections: (state) => {
      state.websockets = {
        chat: null,
        routerTrace: null,
        analytics: null,
      };
      state.activeStreams = {};
      state.connectionErrors = [];
    },
  },
});

// Export actions
export const {
  setOnlineStatus,
  setConnectionQuality,
  setWebSocketConnection,
  setWebSocketStatus,
  incrementReconnectAttempts,
  handleWebSocketMessage,
  clearStream,
  updateLastActivity,
  setLatency,
  addConnectionError,
  resolveConnectionError,
  clearConnectionError,
  cleanupConnections,
} = connectionSlice.actions;

// Export selectors
export const selectOnlineStatus = (state: RootState) => state.connection.online;
export const selectConnectionQuality = (state: RootState) => state.connection.connectionQuality;
export const selectWebSocketStatus = (type: keyof ConnectionState['websockets']) => 
  (state: RootState) => state.connection.websockets[type]?.status || 'disconnected';
export const selectActiveStreams = (state: RootState) => state.connection.activeStreams;
export const selectStreamBuffer = (messageId: string) => 
  (state: RootState) => state.connection.activeStreams[messageId]?.buffer.join('') || '';
export const selectConnectionErrors = (state: RootState) => state.connection.connectionErrors;
export const selectUnresolvedErrors = (state: RootState) => 
  state.connection.connectionErrors.filter(error => !error.resolved);
export const selectLatency = (state: RootState) => state.connection.latency;

export default connectionSlice.reducer;
