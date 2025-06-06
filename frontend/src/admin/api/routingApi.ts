// Mock API for routing rules
import routingRulesMock from '../mocks/routingRules.json';

export async function fetchRoutingRules() {
  await new Promise(res => setTimeout(res, 300));
  return routingRulesMock;
}

export async function createRoutingRule(payload) {
  return { ...payload, id: Date.now(), status: 'Active', createdAt: new Date().toISOString() };
}

export async function updateRoutingRule(id, payload) {
  return { ...payload, id };
}

export async function deleteRoutingRule(id) {
  return { success: true };
}

export async function testRoutingRule(prompt) {
  // Simulate test
  return { matchedAgents: ['ChartAgent', 'SummaryAgent'] };
} 