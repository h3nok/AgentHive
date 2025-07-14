export interface AgentCapabilityIn {
  name: string;
  description: string;
  performance_score?: number;
  cost_per_execution?: number;
  required_resources?: Record<string, any>;
}

export interface AgentRegistrationRequest {
  agent_id: string;
  name: string;
  agent_type: string;
  capabilities: AgentCapabilityIn[];
  max_concurrent_tasks?: number;
}

export interface AgentRegistrationResponse {
  agent_id: string;
  name: string;
  agent_type: string;
  status: string;
  capabilities: AgentCapabilityIn[];
  message: string;
}

export async function registerAgent(payload: AgentRegistrationRequest): Promise<AgentRegistrationResponse> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
  const url = `${API_BASE_URL}/v1/orchestrator/agents/register`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('access_token') ? { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register agent: ${error}`);
  }
  return response.json();
} 