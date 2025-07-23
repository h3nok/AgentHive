/**
 * Normalized Entity Storage - Consolidated State Management
 * Replaces fragmented entity storage across multiple slices
 */

import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Entity Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  department: string;
  storeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  title: string;
  userId: string;
  agentId?: string;
  status: 'active' | 'completed' | 'archived';
  messageIds: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  sessionId: string;
  text: string;
  sender: 'user' | 'assistant' | 'system';
  agentId?: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'error' | 'delivered';
  metadata?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  steps: WorkflowStep[];
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  input?: string;
  output?: string;
  order: number;
}

// Entity Adapters for normalized storage
const usersAdapter = createEntityAdapter<User>();
const agentsAdapter = createEntityAdapter<Agent>();
const sessionsAdapter = createEntityAdapter<Session>({
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
});
const messagesAdapter = createEntityAdapter<Message>({
  sortComparer: (a, b) => a.timestamp.localeCompare(b.timestamp),
});
const workflowsAdapter = createEntityAdapter<Workflow>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

// Initial state
const initialState = {
  users: usersAdapter.getInitialState(),
  agents: agentsAdapter.getInitialState(),
  sessions: sessionsAdapter.getInitialState(),
  messages: messagesAdapter.getInitialState(),
  workflows: workflowsAdapter.getInitialState(),
  
  // Active references
  activeUserId: null as string | null,
  activeSessionId: null as string | null,
  activeWorkflowId: null as string | null,
};

// Entities slice
const entitiesSlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    // User actions
    addUser: (state, action: PayloadAction<User>) => {
      usersAdapter.addOne(state.users, action.payload);
    },
    updateUser: (state, action: PayloadAction<{ id: string; changes: Partial<User> }>) => {
      usersAdapter.updateOne(state.users, action.payload);
    },
    setActiveUser: (state, action: PayloadAction<string>) => {
      state.activeUserId = action.payload;
    },

    // Agent actions
    addAgent: (state, action: PayloadAction<Agent>) => {
      agentsAdapter.addOne(state.agents, action.payload);
    },
    updateAgent: (state, action: PayloadAction<{ id: string; changes: Partial<Agent> }>) => {
      agentsAdapter.updateOne(state.agents, action.payload);
    },
    setAgents: (state, action: PayloadAction<Agent[]>) => {
      agentsAdapter.setAll(state.agents, action.payload);
    },

    // Session actions
    addSession: (state, action: PayloadAction<Session>) => {
      sessionsAdapter.addOne(state.sessions, action.payload);
    },
    updateSession: (state, action: PayloadAction<{ id: string; changes: Partial<Session> }>) => {
      sessionsAdapter.updateOne(state.sessions, action.payload);
    },
    setActiveSession: (state, action: PayloadAction<string>) => {
      state.activeSessionId = action.payload;
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      sessionsAdapter.setAll(state.sessions, action.payload);
    },

    // Message actions
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      messagesAdapter.addOne(state.messages, message);
      
      // Update session's messageIds
      const session = state.sessions.entities[message.sessionId];
      if (session) {
        session.messageIds = [...(session.messageIds || []), message.id];
        session.updatedAt = new Date().toISOString();
      }
    },
    updateMessage: (state, action: PayloadAction<{ id: string; changes: Partial<Message> }>) => {
      messagesAdapter.updateOne(state.messages, action.payload);
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      messagesAdapter.setAll(state.messages, action.payload);
    },

    // Workflow actions
    addWorkflow: (state, action: PayloadAction<Workflow>) => {
      workflowsAdapter.addOne(state.workflows, action.payload);
    },
    updateWorkflow: (state, action: PayloadAction<{ id: string; changes: Partial<Workflow> }>) => {
      workflowsAdapter.updateOne(state.workflows, action.payload);
    },
    setActiveWorkflow: (state, action: PayloadAction<string>) => {
      state.activeWorkflowId = action.payload;
    },

    // Bulk operations
    clearAllEntities: (state) => {
      usersAdapter.removeAll(state.users);
      agentsAdapter.removeAll(state.agents);
      sessionsAdapter.removeAll(state.sessions);
      messagesAdapter.removeAll(state.messages);
      workflowsAdapter.removeAll(state.workflows);
      state.activeUserId = null;
      state.activeSessionId = null;
      state.activeWorkflowId = null;
    },
  },
  extraReducers: (builder) => {
    // Handle chatApi custom actions
    builder
      .addCase('chat/updateAssistantMessage' as any, (state, action: PayloadAction<{ id: string; text: string }>) => {
        console.log('🔧 Redux: Handling updateAssistantMessage action:', action.payload);
        messagesAdapter.updateOne(state.messages, {
          id: action.payload.id,
          changes: { text: action.payload.text }
        });
      })
      .addCase('chat/assistantRequestStarted' as any, (state, action) => {
        console.log('🔧 Redux: Handling assistantRequestStarted action');
        // Processing state handled elsewhere - this is just for debugging
      })
      .addCase('chat/assistantResponseFinished' as any, (state, action) => {
        console.log('🔧 Redux: Handling assistantResponseFinished action');
        // Processing state handled elsewhere - this is just for debugging
      });
  },
});

// Export actions
export const {
  addUser,
  updateUser,
  setActiveUser,
  addAgent,
  updateAgent,
  setAgents,
  addSession,
  updateSession,
  setActiveSession,
  setSessions,
  addMessage,
  updateMessage,
  setMessages,
  addWorkflow,
  updateWorkflow,
  setActiveWorkflow,
  clearAllEntities,
} = entitiesSlice.actions;

// Export selectors
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors((state: RootState) => state.entities.users);

export const {
  selectAll: selectAllAgents,
  selectById: selectAgentById,
  selectIds: selectAgentIds,
} = agentsAdapter.getSelectors((state: RootState) => state.entities.agents);

export const {
  selectAll: selectAllSessions,
  selectById: selectSessionById,
  selectIds: selectSessionIds,
} = sessionsAdapter.getSelectors((state: RootState) => state.entities.sessions);

export const {
  selectAll: selectAllMessages,
  selectById: selectMessageById,
  selectIds: selectMessageIds,
} = messagesAdapter.getSelectors((state: RootState) => state.entities.messages);

export const {
  selectAll: selectAllWorkflows,
  selectById: selectWorkflowById,
  selectIds: selectWorkflowIds,
} = workflowsAdapter.getSelectors((state: RootState) => state.entities.workflows);

// Computed selectors
export const selectActiveUser = (state: RootState) => 
  state.entities.activeUserId ? selectUserById(state, state.entities.activeUserId) : null;

export const selectActiveSession = (state: RootState) =>
  state.entities.activeSessionId ? selectSessionById(state, state.entities.activeSessionId) : null;

export const selectActiveSessionId = (state: RootState) => state.entities.activeSessionId;

export const selectActiveWorkflow = (state: RootState) =>
  state.entities.activeWorkflowId ? selectWorkflowById(state, state.entities.activeWorkflowId) : null;

export const selectMessagesBySession = (state: RootState, sessionId: string) =>
  selectAllMessages(state).filter(message => message.sessionId === sessionId);

export const selectActiveSessionMessages = (state: RootState) => {
  const activeSession = selectActiveSession(state);
  return activeSession ? selectMessagesBySession(state, activeSession.id) : [];
};

export default entitiesSlice.reducer;
