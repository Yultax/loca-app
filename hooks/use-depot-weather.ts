'use client';

import { useState, useEffect } from 'react';

interface DepotWeather {
  tempC: number;
  humidity: number;
  windKmh: number;
  precipitation: boolean;
  description: string;
  source: 'live' | 'cache' | 'fallback';
  isLoading: boolean;
}

const POLL_INTERVAL = 60_000; // 60s — weather doesn't change fast

export function useDepotWeather(coordinates: [number, number] | null): DepotWeather {
  const [weather, setWeather] = useState<DepotWeather>({
    tempC: 0,
    humidity: 0,
    windKmh: 0,
    precipitation: false,
    description: '',
    source: 'fallback',
    isLoading: true,
  });

  const lat = coordinates?.[0] ?? null;
  const lon = coordinates?.[1] ?? null;

  useEffect(() => {
    if (lat === null || lon === null) return;

    let active = true;

    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lon }),
        });
        if (!res.ok) throw new Error(`Weather API ${res.status}`);
        const data = await res.json();
        if (!active) return;
        setWeather({
          tempC: data.tempC,
          humidity: data.humidity,
          windKmh: data.windKmh,
          precipitation: data.precipitation,
          description: data.description ?? '',
          source: data.source,
          isLoading: false,
        });
      } catch {
        if (!active) return;
        setWeather(prev => ({ ...prev, isLoading: false, source: 'fallback' }));
      }
    }

    fetchWeather();
    const timer = setInterval(fetchWeather, POLL_INTERVAL);
    return () => { active = false; clearInterval(timer); };
  }, [lat, lon]);

  return weather;
}
