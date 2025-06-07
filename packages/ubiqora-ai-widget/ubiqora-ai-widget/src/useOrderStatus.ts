import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useOrderStatus(query: string) {
  const match = query.match(/\b(\d{5,})\b/);
  const orderId = match ? match[0] : null;
  const { data, error } = useSWR(orderId ? `/api/orders/${orderId}` : null, fetcher);
  return { data, error };
}
