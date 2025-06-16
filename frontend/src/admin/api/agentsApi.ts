// Mock API for agents
import agentsMock from '../mocks/agents.json';

export async function fetchAgents() {
  await new Promise(res => setTimeout(res, 300));
  return agentsMock;
}

export async function createAgent(payload: any) {
  return { ...payload, id: Date.now(), status: 'Active', createdAt: new Date().toISOString() };
}

export async function updateAgent(id: string | number, payload: any) {
  return { ...payload, id };
}

export async function deleteAgent(id: string | number) {
  return { success: true };
}

export async function deployAgent(id: string | number) {
  return { id, status: 'Active' };
}

export async function undeployAgent(id: string | number) {
  return { id, status: 'Inactive' };
}

export async function getAgentVersions(id: string | number) {
  return [
    { version: '1.0', timestamp: '2024-06-01T12:00:00Z' },
    { version: '0.9', timestamp: '2024-05-01T12:00:00Z' },
  ];
} 