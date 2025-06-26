/**
 * Enterprise OS API Service
 * 
 * This service handles all API calls for the Autonomous Enterprise OS
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface SystemHealth {
  status: string;
  uptime: string;
  cpu_usage: number;
  memory_usage: number;
  storage_usage: number;
  network_throughput: number;
  active_agents: number;
  total_workflows: number;
  completed_today: number;
  error_rate: number;
  response_time: number;
  last_updated: string;
}

export interface CostAnalysis {
  daily_operations_cost: number;
  monthly_projected: number;
  annual_savings: number;
  cost_per_workflow: number;
  efficiency_gain: number;
  manual_cost_avoided: number;
  roi_percentage: number;
  breakdown: {
    compute: number;
    storage: number;
    networking: number;
    ai_processing: number;
  };
}

export interface DepartmentPerformance {
  departments: Array<{
    name: string;
    efficiency: number;
    workflows_completed: number;
    avg_completion_time: number;
    cost_savings: number;
    employee_satisfaction: number;
    automation_rate: number;
  }>;
  last_updated: string;
}

export interface AgentStatus {
  agents: Array<{
    id: string;
    type: string;
    status: string;
    workload: number;
    success_rate: number;
    avg_response_time: number;
    tasks_completed: number;
    memory_usage: number;
    uptime: string;
    last_active: string;
  }>;
  network_health: number;
  total_interactions: number;
  collaborative_tasks: number;
}

export interface AgentNetwork {
  nodes: Array<{
    id: string;
    type: string;
    status: string;
    position: { x: number; y: number };
  }>;
  connections: Array<{
    source: string;
    target: string;
    strength: number;
    data_flow: number;
    last_interaction: string;
  }>;
  network_efficiency: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  estimated_time: string;
  success_rate: number;
  usage_count: number;
  agents_involved: string[];
  steps: number;
  complexity: string;
}

export interface ActiveWorkflow {
  id: string;
  template_id: string;
  name: string;
  initiated_by: string;
  current_step: number;
  total_steps: number;
  progress: number;
  status: string;
  assigned_agent: string;
  started_at: string;
  estimated_completion: string;
  priority: string;
}

export interface ChatResponse {
  response: string;
  agent_type: string;
  session_id: string;
  suggestions: string[];
  quick_actions: Array<{
    label: string;
    action: string;
    params: string;
  }>;
  metadata: {
    processing_time: number;
    confidence: number;
    workflow_suggestions: string[];
  };
}

class EnterpriseAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}/enterprise${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers when available
        // 'Authorization': `Bearer ${token}`,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // System Health & Analytics
  async getSystemHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/system/health');
  }

  async getCostAnalysis(): Promise<CostAnalysis> {
    return this.request<CostAnalysis>('/system/costs');
  }

  async getDepartmentPerformance(): Promise<DepartmentPerformance> {
    return this.request<DepartmentPerformance>('/departments/performance');
  }

  // Agent Management
  async getAgentsStatus(): Promise<AgentStatus> {
    return this.request<AgentStatus>('/agents/status');
  }

  async getAgentNetwork(): Promise<AgentNetwork> {
    return this.request<AgentNetwork>('/agents/network');
  }

  // Workflow Management
  async getWorkflowTemplates(): Promise<{ templates: WorkflowTemplate[]; total_count: number; categories: string[] }> {
    return this.request('/workflows/templates');
  }

  async getActiveWorkflows(): Promise<{ workflows: ActiveWorkflow[]; total_active: number; average_completion_time: number }> {
    return this.request('/workflows/active');
  }

  async triggerWorkflow(templateId: string, context: Record<string, any>): Promise<{
    workflow_id: string;
    template_id: string;
    status: string;
    estimated_completion: string;
    message: string;
  }> {
    return this.request('/workflows/trigger', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        context,
      }),
    });
  }

  async getWorkflowStatus(workflowId: string): Promise<{
    workflow_id: string;
    status: string;
    progress: number;
    current_step: number;
    total_steps: number;
    logs: Array<{
      timestamp: string;
      level: string;
      message: string;
      agent: string;
    }>;
  }> {
    return this.request(`/workflows/${workflowId}/status`);
  }

  // Chat & AI Assistant
  async sendChatMessage(
    prompt: string,
    sessionId?: string,
    context?: Record<string, any>
  ): Promise<ChatResponse> {
    return this.request('/chat/enterprise', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        session_id: sessionId,
        context: context || {},
        history: [],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false,
      }),
    });
  }

  // Utility methods for real-time updates
  async subscribeToUpdates(callback: (data: any) => void): Promise<() => void> {
    // WebSocket connection for real-time updates
    const wsUrl = this.baseURL.replace('http', 'ws') + '/enterprise/ws';
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Return cleanup function
    return () => {
      ws.close();
    };
  }

  // Polling-based updates for components that need regular data refresh
  startPolling(
    endpoint: string,
    callback: (data: any) => void,
    interval: number = 30000
  ): () => void {
    const poll = async () => {
      try {
        const data = await this.request(endpoint);
        callback(data);
      } catch (error) {
        console.error(`Polling error for ${endpoint}:`, error);
      }
    };

    // Initial fetch
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

// Create singleton instance
export const enterpriseAPI = new EnterpriseAPIService();

// Export individual methods for easier testing
export const {
  getSystemHealth,
  getCostAnalysis,
  getDepartmentPerformance,
  getAgentsStatus,
  getAgentNetwork,
  getWorkflowTemplates,
  getActiveWorkflows,
  triggerWorkflow,
  getWorkflowStatus,
  sendChatMessage,
  subscribeToUpdates,
  startPolling,
} = enterpriseAPI;
