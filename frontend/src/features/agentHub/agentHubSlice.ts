import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ViewMode = 'grid' | 'list' | 'graph';

interface AgentHubState {
  searchTerm: string;
  viewMode: ViewMode;
  selectedAgentId: string | null;
}

const initialState: AgentHubState = {
  searchTerm: '',
  viewMode: 'grid',
  selectedAgentId: null,
};

const agentHubSlice = createSlice({
  name: 'agentHub',
  initialState,
  reducers: {
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    setSelectedAgent(state, action: PayloadAction<string | null>) {
      state.selectedAgentId = action.payload;
    },
  },
});

export const { setSearchTerm, setViewMode, setSelectedAgent } = agentHubSlice.actions;
export default agentHubSlice.reducer;
