'use client';
import useSWR from 'swr';

export function useTcmbRate() {
  const { data, error } = useSWR('/api/tcmb', (url) => fetch(url).then(r => r.json()), {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    errorRetryInterval: 1000,
    errorRetryCount: 5,
  });
  return { rate: data, isLoading: !data && !error, isError: error };
}
