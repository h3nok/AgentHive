/* Simple keyword-based router. Replace with ML if needed */
export function classifyAndRoute(prompt: string): string[] {
  const p = prompt.toLowerCase();
  if (p.startsWith('/chart') || p.startsWith('/graph') || p.includes('chart') || p.includes('graph')) {
    return ['ChartAgent'];
  }
  if (p.includes('timeoff') || p.includes('pto') || p.includes('ugk')) {
    return ['TimeOffAgent'];
  }
  if (p.includes('lease')) {
    return ['LeaseAgent'];
  }
  // multi-agent example: combine data + chart
  if (p.includes('sales') && p.includes('forecast')) {
    return ['ChartAgent', 'ForecastAgent'];
  }
  return ['GeneralAgent'];
} 