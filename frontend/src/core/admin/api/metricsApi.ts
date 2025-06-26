// Mock API for metrics
import metricsMock from '../mocks/metrics.json';

export async function fetchConversations(from: string, to: string) {
  await new Promise(res => setTimeout(res, 300));
  return metricsMock.conversations;
}

export async function fetchAgentUtilization(from: string, to: string) {
  await new Promise(res => setTimeout(res, 300));
  return metricsMock.agentUtilization;
}

export async function fetchResponseTimes(from: string, to: string) {
  await new Promise(res => setTimeout(res, 300));
  return metricsMock.responseTimes;
} 