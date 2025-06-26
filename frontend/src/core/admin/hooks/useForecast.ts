import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/utils/apiClient';
import type { HeadsUpForecast } from '../components/HeadsUpTile';
import type { AxiosError } from 'axios';

const mockForecast: HeadsUpForecast = {
  kpi: 'token_spend',
  daysToBudget: 3,
};

async function fetchForecast(): Promise<HeadsUpForecast | null> {
  const useMock = import.meta.env.VITE_MOCK_FORECAST === 'true';
  if (useMock) return mockForecast;

  try {
    const { data } = await api.get('/api/forecast');
    return data.headsUp as HeadsUpForecast;
  } catch (err: unknown) {
    const axiosErr = err as AxiosError | undefined;
    // Graceful fallback for dev when backend not running
    if (axiosErr?.response?.status === 404 || (axiosErr as any)?.code === 'ECONNREFUSED') {
      return mockForecast;
    }
    console.warn('Forecast fetch failed', err);
    return null;
  }
}

export const useForecast = () =>
  useQuery({
    queryKey: ['forecast'],
    queryFn: fetchForecast,
    refetchInterval: 5 * 60 * 1000,
    retry: false, // avoid noisy network retries in dev
  });
