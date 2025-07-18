import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AutoRoutingState {
  enabled: boolean;
}

const initialState: AutoRoutingState = {
  enabled: true, // default to on to preserve current behaviour
};

const autoRoutingSlice = createSlice({
  name: 'autoRouting',
  initialState,
  reducers: {
    setAutoRouting(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload;
    },
    toggleAutoRouting(state) {
      state.enabled = !state.enabled;
    },
  },
});

export const { setAutoRouting, toggleAutoRouting } = autoRoutingSlice.actions;
export default autoRoutingSlice.reducer;
