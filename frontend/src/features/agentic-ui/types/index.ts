/**
 * Type definitions for Enterprise Agentic UI System
 */

export type AgentFramework = 'custom' | 'langchain' | 'hybrid';

export type AgentType = 'hr' | 'data' | 'finance' | 'general' | 'support' | 'code';

export type AgentStatus = 'active' | 'thinking' | 'waiting' | 'offline' | 'error';

export type WorkflowStepStatus = 'pending' | 'active' | 'completed' | 'error' | 'skipped';

export type WorkflowStepType = 'planning' | 'tool_execution' | 'synthesis' | 'validation' | 'handoff';

export type MessageType = 'user' | 'agent' | 'system' | 'workflow' | 'collaboration';

export type UIMode = 'conversational' | 'workflow' | 'collaboration' | 'admin';

// Core Agent Interface
export interface AgentPersona {
  id: string;
  name: string;
  type: AgentType;
  framework: AgentFramework;
  avatar: string;
  status: AgentStatus;
  capabilities: string[];
  description: string;
  currentTask?: string;
  performance: {
    avgResponseTime: number;
    successRate: number;
    totalRequests: number;
  };
  metadata: {
    version: string;
    lastActive: Date;
    specializations: string[];
  };
}

// Workflow System
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: WorkflowStepStatus;
  type: WorkflowStepType;
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  dependencies: string[]; // Step IDs this depends on
  metadata: {
    toolName?: string;
    agentId?: string;
    inputData?: any;
    outputData?: any;
    errorMessage?: string;
    retryCount?: number;
    cost?: number;
    tokensUsed?: number;
  };
}

export interface AgenticWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'executing' | 'completed' | 'error' | 'paused';
  steps: WorkflowStep[];
  initiatedBy: string; // User ID
  assignedAgents: string[]; // Agent IDs
  startTime: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  progress: {
    overall: number; // 0-100
    currentStep: number;
    totalSteps: number;
  };
  metrics: {
    totalCost: number;
    totalTokens: number;
    totalDuration: number;
    toolsUsed: string[];
  };
  context: {
    userIntent: string;
    businessContext?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
  };
}

// Enhanced Chat Messages
export interface AgenticMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  userId?: string;
  agent?: AgentPersona;
  workflow?: {
    id: string;
    status: AgenticWorkflow['status'];
    currentStep?: WorkflowStep;
    progress: number;
  };
  metadata: {
    tokensUsed?: number;
    cost?: number;
    sources?: Array<{
      id: string;
      name: string;
      type: 'document' | 'database' | 'api' | 'knowledge_base';
      confidence: number;
      excerpt?: string;
    }>;
    confidence?: number;
    processingTime?: number;
    framework?: AgentFramework;
  };
  reactions?: Array<{
    userId: string;
    type: 'helpful' | 'accurate' | 'unclear' | 'incorrect';
    timestamp: Date;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

// Collaboration Features
export interface CollaborationSession {
  id: string;
  name: string;
  participants: Array<{
    userId: string;
    role: 'owner' | 'collaborator' | 'viewer';
    joinedAt: Date;
    status: 'active' | 'away' | 'offline';
  }>;
  activeAgents: AgentPersona[];
  sharedContext: {
    documents: string[];
    workflows: string[];
    notes: string;
  };
  createdAt: Date;
  lastActivity: Date;
}

// UI State Management
export interface AgenticUIState {
  mode: UIMode;
  activeAgent?: AgentPersona;
  availableAgents: AgentPersona[];
  currentWorkflow?: AgenticWorkflow;
  messages: AgenticMessage[];
  collaborationSession?: CollaborationSession;
  preferences: {
    showWorkflowDetails: boolean;
    autoExpandWorkflows: boolean;
    enableAnimations: boolean;
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
    read: boolean;
    actionable?: {
      label: string;
      action: () => void;
    };
  }>;
}

// Animation & Interaction
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface WorkflowVisualizationProps {
  workflow: AgenticWorkflow;
  interactive?: boolean;
  showMetrics?: boolean;
  onStepClick?: (step: WorkflowStep) => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

// Enterprise Features
export interface EnterpriseContext {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    permissions: string[];
  };
  organization: {
    id: string;
    name: string;
    domain: string;
    settings: {
      dataClassification: boolean;
      auditLogging: boolean;
      approvalWorkflows: boolean;
      costLimits: {
        daily: number;
        monthly: number;
      };
    };
  };
  session: {
    id: string;
    startTime: Date;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
  };
}

// API Integration
export interface AgenticAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    framework?: AgentFramework;
  };
}

// Real-time Updates
export interface WorkflowUpdate {
  workflowId: string;
  type: 'step_started' | 'step_completed' | 'step_error' | 'progress_update' | 'workflow_completed';
  stepId?: string;
  data: any;
  timestamp: Date;
}

export interface AgentUpdate {
  agentId: string;
  type: 'status_change' | 'task_assigned' | 'task_completed' | 'performance_update';
  data: any;
  timestamp: Date;
}

// Component Props
export interface AgentSelectorProps {
  agents: AgentPersona[];
  selectedAgent?: AgentPersona;
  onAgentSelect: (agent: AgentPersona) => void;
  showPerformance?: boolean;
  compact?: boolean;
}

export interface ChatInterfaceProps {
  messages: AgenticMessage[];
  onSendMessage: (content: string) => void;
  onWorkflowExpand?: (workflowId: string) => void;
  loading?: boolean;
  placeholder?: string;
  enableVoiceInput?: boolean;
  enableFileUpload?: boolean;
}

export interface WorkflowProgressProps {
  workflow: AgenticWorkflow;
  showDetails?: boolean;
  onStepClick?: (step: WorkflowStep) => void;
  animationConfig?: AnimationConfig;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WorkflowStepWithTiming = WorkflowStep & {
  timing: {
    queueTime: number;
    executionTime: number;
    totalTime: number;
  };
};

export type AgentPerformanceMetrics = {
  agentId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    costPerRequest: number;
    userSatisfactionScore: number;
  };
};

// Event Types for Analytics
export interface AgenticUIEvent {
  type: 'agent_selected' | 'workflow_started' | 'message_sent' | 'step_clicked' | 'mode_changed';
  data: any;
  timestamp: Date;
  userId: string;
  sessionId: string;
}

export default {};
