import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  sessionId: string | null;
  streamBuffer: Map<string, string[]>;
  error: string | null;
}

const initialState: WebSocketState = {
  connected: false,
  connecting: false,
  sessionId: null,
  streamBuffer: new Map(),
  error: null,
};

// WebSocket connection management
let ws: WebSocket | null = null;

export const connectWebSocket = createAsyncThunk(
  'websocket/connect',
  async (sessionId: string, { dispatch }) => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}://${window.location.host}/v1/stream/${sessionId}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      dispatch(websocketConnected());
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(handleStreamMessage(data));
    };
    
    ws.onerror = (error) => {
      dispatch(websocketError(error.toString()));
    };
    
    ws.onclose = () => {
      dispatch(websocketDisconnected());
    };
    
    return sessionId;
  }
);

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    websocketConnected: (state) => {
      state.connected = true;
      state.connecting = false;
      state.error = null;
    },
    websocketDisconnected: (state) => {
      state.connected = false;
      state.connecting = false;
    },
    websocketError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.connecting = false;
    },
    handleStreamMessage: (state, action: PayloadAction<any>) => {
      // Handle different message types from backend
      const { type, content, messageId } = action.payload;
      
      switch (type) {
        case 'token':
          // Accumulate tokens for streaming display
          if (!state.streamBuffer.has(messageId)) {
            state.streamBuffer.set(messageId, []);
          }
          state.streamBuffer.get(messageId)?.push(content);
          break;
        case 'end':
          // Clear buffer for completed message
          state.streamBuffer.delete(messageId);
          break;
        case 'error':
          state.error = content;
          break;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectWebSocket.pending, (state) => {
        state.connecting = true;
      })
      .addCase(connectWebSocket.fulfilled, (state, action) => {
        state.sessionId = action.payload;
      });
  },
});

export const {
  websocketConnected,
  websocketDisconnected,
  websocketError,
  handleStreamMessage,
} = websocketSlice.actions;

export const selectWebSocketState = (state: RootState) => state.websocket;
export const selectStreamBuffer = (messageId: string) => (state: RootState) => 
  state.websocket.streamBuffer.get(messageId)?.join('') || '';

export default websocketSlice.reducer; 