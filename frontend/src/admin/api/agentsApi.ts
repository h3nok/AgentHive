// Mock API for agents
import agentsMock from '../mocks/agents.json';

export async function fetchAgents() {
  await new Promise(res => setTimeout(res, 300));
  return agentsMock;
}

export async function createAgent(payload) {
  return { ...payload, id: Date.now(), status: 'Active', createdAt: new Date().toISOString() };
}

export async function updateAgent(id, payload) {
  return { ...payload, id };
}

export async function deleteAgent(id) {
  return { success: true };
}

export async function deployAgent(id) {
  return { id, status: 'Active' };
}

export async function undeployAgent(id) {
  return { id, status: 'Inactive' };
}

export async function getAgentVersions(id) {
  return [
    { version: '1.0', timestamp: '2024-06-01T12:00:00Z' },
    { version: '0.9', timestamp: '2024-05-01T12:00:00Z' },
  ];
} 