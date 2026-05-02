'use client';
import useSWR from 'swr';

interface TobbPriceData {
  borsaAdi: string;
  tarih: string;
  enAz: number;
  enCok: number;
  ortalama: number;
  islemMiktariKg: number;
  source: 'live' | 'fallback';
}

export function useTobbPrice() {
  const { data, error } = useSWR<TobbPriceData>(
    '/api/tobb-price',
    (url: string) => fetch(url).then(r => r.json()),
    {
      refreshInterval: 300_000, // 5 min
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );
  return { price: data, isLoading: !data && !error, isError: !!error };
}
