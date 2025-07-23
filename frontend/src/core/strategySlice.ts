import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../shared/store';

// Define routing strategies
export type RoutingStrategy = 'latency' | 'cost' | 'accuracy';

interface StrategyState {
  current: RoutingStrategy;
  status: 'idle' | 'saving' | 'success' | 'error';
  error?: string;
}

const initialState: StrategyState = {
  current: 'latency',
  status: 'idle',
};

// Async thunk to POST the new strategy to backend
export const setRoutingStrategy = createAsyncThunk<RoutingStrategy, RoutingStrategy, { state: RootState }>(
  'strategy/setRoutingStrategy',
  async (strategy, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/v1/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      return strategy;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

const strategySlice = createSlice({
  name: 'strategy',
  initialState,
  reducers: {
    // Local (optimistic) switch, no API call
    setLocalStrategy(state, action: PayloadAction<RoutingStrategy>) {
      state.current = action.payload;
      state.status = 'idle';
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setRoutingStrategy.pending, (state) => {
        state.status = 'saving';
        state.error = undefined;
      })
      .addCase(setRoutingStrategy.fulfilled, (state, action) => {
        state.current = action.payload;
        state.status = 'success';
      })
      .addCase(setRoutingStrategy.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });
  },
});

export const { setLocalStrategy } = strategySlice.actions;

// Selectors
export const selectRoutingStrategy = (state: RootState) => state.strategy.current;
export const selectStrategyStatus = (state: RootState) => state.strategy.status;
export const selectStrategyError = (state: RootState) => state.strategy.error;

export default strategySlice.reducer;
