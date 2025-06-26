import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/utils/apiClient';

export interface TrendPoint {
  ts: number; // epoch sec
  azure: number; // tokens
  chatgpt: number; // tokens
}

const mockTrend: TrendPoint[] = Array.from({ length: 30 }).map((_, i) => ({
  ts: Date.now() / 1000 - (29 - i) * 3600,
  azure: 50 + Math.random() * 20,
  chatgpt: 70 + Math.random() * 30,
}));

const fetchTrends = async (): Promise<TrendPoint[]> => {
  if (import.meta.env.DEV) return mockTrend;
  try {
    const { data } = await api.get('/api/metrics/usage-trends');
    return data as TrendPoint[];
  } catch (err) {
    console.warn('Fallback usage trends', err);
    return mockTrend;
  }
};

export const useUsageTrends = () =>
  useQuery({ queryKey: ['usage-trend'], queryFn: fetchTrends, staleTime: 60000, refetchInterval: 60000 });
