import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ProcessingState = "pending" | "ok" | "error";

export interface ProcessingStep {
  id: string;
  label: string;
  icon?: string; // MUI icon name or identifier – keep generic
  state: ProcessingState;
  detail?: string;
  startedAt: number;
  finishedAt?: number;
}

interface TimelineState {
  [sessionId: string]: ProcessingStep[];
}

const initialState: TimelineState = {};

export const processingSlice = createSlice({
  name: "processing",
  initialState,
  reducers: {
    stepAdded: (
      state,
      action: PayloadAction<{ sessionId: string; step: ProcessingStep }>
    ) => {
      const { sessionId, step } = action.payload;
      state[sessionId] = [...(state[sessionId] || []), step];
    },
    stepUpdated: (
      state,
      action: PayloadAction<{
        sessionId: string;
        id: string;
        state: ProcessingState;
        detail?: string;
      }>
    ) => {
      const { sessionId, id, state: newState, detail } = action.payload;
      const timeline = state[sessionId];
      if (!timeline) return;
      const step = timeline.find((s) => s.id === id);
      if (step) {
        step.state = newState;
        if (detail !== undefined) step.detail = detail;
        if (newState !== "pending") step.finishedAt = Date.now();
      }
    },
    timelineCleared: (state, action: PayloadAction<{ sessionId: string }>) => {
      delete state[action.payload.sessionId];
    },
  },
});

export const { stepAdded, stepUpdated, timelineCleared } = processingSlice.actions;

export default processingSlice.reducer; 