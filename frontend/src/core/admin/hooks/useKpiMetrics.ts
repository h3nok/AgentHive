import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/utils/apiClient';

export interface KpiMetrics {
  activeAgents: number;
  dailyRequests: number;
  p95Latency: number;
  tokenCost: number;
  errorRate: number;
  throughput: number;
  [key: string]: number;
}

const FALLBACK_METRICS: KpiMetrics = {
  activeAgents: 7,
  dailyRequests: 1850,
  p95Latency: 120,
  tokenCost: 12.35,
  errorRate: 2.1,
  throughput: 56,
};

const fetchKpiMetrics = async (): Promise<KpiMetrics> => {
  if (import.meta.env.DEV) {
    // In local dev, avoid proxy errors by using mock metrics
    return FALLBACK_METRICS;
  }

  try {
    const res = await api.get('/api/metrics');
    return res.data as KpiMetrics;
  } catch (err) {
    console.warn('Failed to fetch KPI metrics, using fallback', err);
    return FALLBACK_METRICS;
  }
};

export const useKpiMetrics = (autoRefresh = true) => {
  return useQuery({
    queryKey: ['kpi-metrics'],
    queryFn: fetchKpiMetrics,
    refetchInterval: autoRefresh ? 30000 : false,
    // Provide some staleTime to reduce flashing
    staleTime: 15000,
  });
};
