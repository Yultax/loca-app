'use client';

import useSWR from 'swr';
import { useSelectedLoca } from './use-loca-state';
import type { SellDecision } from '@/lib/types';

const fetcher = async (url: string, locaId: string): Promise<SellDecision> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locaId }),
  });
  if (!res.ok) throw new Error('Decision fetch failed');
  return res.json();
};

export function useDecisionState() {
  const loca = useSelectedLoca();
  const locaId = loca?.id;
  const shouldFetch = !!(locaId && loca?.varietyId);

  const { data, error, isLoading, mutate } = useSWR<SellDecision>(
    shouldFetch ? ['decision', locaId] : null,
    ([, id]: [string, string]) => fetcher('/api/decision', id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryInterval: 1000,
      errorRetryCount: 5,
    }
  );

  return {
    decision: data ?? null,
    isLoading: shouldFetch && isLoading,
    error,
    refresh: () => mutate(),
  };
}
