import { useQuery } from '@tanstack/react-query';
import api from '../../lib/apiClient';

export interface REPoint {
  ts: number; // epoch seconds
  requests: number; // total requests
  errors: number; // total errors
}

// generate 30 mock hourly points
const mockSeries: REPoint[] = Array.from({ length: 30 }).map((_, idx) => ({
  ts: Date.now() / 1000 - (29 - idx) * 3600,
  requests: 100 + Math.floor(Math.random() * 40),
  errors: 5 + Math.floor(Math.random() * 10),
}));

const fetchTrend = async (): Promise<REPoint[]> => {
  try {
    const { data } = await api.get('/api/metrics/req-error-trend');
    return data as REPoint[];
  } catch (err) {
    console.warn('Falling back to mock request/error trend', err);
    return mockSeries;
  }
};

export const useRequestErrorTrends = () =>
  useQuery({
    queryKey: ['req-error-trend'],
    queryFn: fetchTrend,
    staleTime: 60000,
    refetchInterval: 60000,
  });
