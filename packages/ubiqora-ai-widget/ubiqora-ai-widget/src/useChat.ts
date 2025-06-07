import useSWR from 'swr';

const fetcher = (url: string, data: any) =>
  fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  }).then(res => res.json());

export function useChat(message: string) {
  const { data, error } = useSWR([
    '/chat/tsc-ecom',
    message
  ], (url, msg) => fetcher(url, { message: msg }), { revalidateOnFocus: false });
  return { data, error };
}
