// Shared types for modular ChatInterface components

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactElement;
  description: string;
  category: 'hr' | 'finance' | 'operations' | 'general';
  color?: string;
  estimatedTime: string;
  agentsRequired: string[];
  prompt: string;
}

export interface SmartSuggestion {
  id: string;
  text: string;
  confidence: number;
  type: 'workflow' | 'query' | 'action';
  icon: React.ReactNode;
  context?: string;
}

export interface CurrentAgent {
  id: string;
  name: string;
  status: string;
}

export interface WorkspaceContext {
  id: string;
  title: string;
  type: 'task' | 'conversation' | 'document' | 'workflow' | 'dashboard';
  relatedTasks?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  agentId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface CurrentWorkflow {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  steps?: WorkflowStep[];
}

// Enhanced props interface for modular ChatInterface
export interface ChatInterfaceProps {
  onSendMessage: (message: string, agent?: string, workflow?: string) => void;
  isLoading?: boolean;
  messages?: any[]; // Will use proper Message type from entities slice
  sessionId?: string | null;
  onWorkflowTrigger?: (workflowId: string, params?: Record<string, unknown>) => void;
  // Enterprise integration props
  enterpriseMode?: boolean;
  activeWorkflows?: number;
  onNavigateToWorkflows?: () => void;
  onNavigateToAgents?: () => void;
  currentAgent?: CurrentAgent;
  // Future agentic interface props
  agenticMode?: boolean;
  showAgentConsciousness?: boolean;
  enableSwarmVisualization?: boolean;
}

// Event handlers for modular components
export interface ChatInterfaceHandlers {
  onSendMessage: (message: string, agent?: string, workflow?: string) => void;
  onQuickAction: (action: QuickAction) => void;
  onSuggestionClick: (suggestion: SmartSuggestion) => void;
  onToggleAutomationDrawer: () => void;
  onNavigateToWorkflows?: () => void;
  onNavigateToAgents?: () => void;
  onWorkflowTrigger?: (workflowId: string, params?: Record<string, unknown>) => void;
}

// State management for modular ChatInterface
export interface ChatInterfaceState {
  inputValue: string;
  showSuggestions: boolean;
  isAutomationDrawerOpen: boolean;
  selectedAgent: any | null; // Will use proper AgentType
  // Future agentic state
  agentConsciousnessVisible?: boolean;
  swarmVisualizationActive?: boolean;
  spatialLayoutMode?: 'traditional' | 'constellation' | 'neural-network';
}
