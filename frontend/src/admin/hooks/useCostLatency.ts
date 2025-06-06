import { useQuery } from '@tanstack/react-query';
import api from '../../lib/apiClient';

export interface SparkPoint {
  ts: number; // epoch seconds
  cost: number; // dollars
  latency: number; // ms
  throughput: number; // req/s
}

const mockSeries: SparkPoint[] = Array.from({ length: 20 }).map((_, idx) => ({
  ts: Date.now() / 1000 - (20 - idx) * 60,
  cost: 10 + Math.random() * 2,
  latency: 100 + Math.random() * 40,
  throughput: 50 + Math.random() * 10,
}));

const fetchSparkData = async (): Promise<SparkPoint[]> => {
  if (import.meta.env.DEV) {
    return mockSeries;
  }

  try {
    const res = await api.get('/api/metrics/spark');
    return res.data as SparkPoint[];
  } catch (err) {
    console.warn('Falling back to mock spark data', err);
    return mockSeries;
  }
};

export const useCostLatency = (autoRefresh = true) => {
  return useQuery({
    queryKey: ['spark-metrics'],
    queryFn: fetchSparkData,
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 15000,
    // Provide fallback mock data on error
    retry: 1,
  });
};
