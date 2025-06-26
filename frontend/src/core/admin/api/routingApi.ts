// Mock API for routing rules
import routingRulesMock from '../mocks/routingRules.json';

export async function fetchRoutingRules() {
  await new Promise(res => setTimeout(res, 300));
  return routingRulesMock;
}

export async function createRoutingRule(payload: any) {
  return { ...payload, id: Date.now(), status: 'Active', createdAt: new Date().toISOString() };
}

export async function updateRoutingRule(id: string | number, payload: any) {
  return { ...payload, id };
}

export async function deleteRoutingRule(id: string | number) {
  return { success: true };
}

export async function testRoutingRule(prompt: string) {
  // Simulate test
  return { matchedAgents: ['ChartAgent', 'SummaryAgent'] };
} 