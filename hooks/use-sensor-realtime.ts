'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocaDispatch, useLocaState } from './use-loca-state';
import type { SensorReading } from '@/lib/types';

export interface SensorHistoryPoint {
  timestamp: string;
  avgTemp: number;
  avgHumidity: number;
  avgCo2: number;
  avgAmmonia: number;
  avgEthylene: number;
}

const MAX_HISTORY = 80;
const POLL_INTERVAL = 1500;

function generateBackfill(base: SensorHistoryPoint, count: number): SensorHistoryPoint[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - (count - i) * POLL_INTERVAL).toISOString(),
    avgTemp: +(base.avgTemp + (Math.random() - 0.5) * 0.1).toFixed(2),
    avgHumidity: +(base.avgHumidity + (Math.random() - 0.5) * 0.4).toFixed(1),
    avgCo2: Math.round(base.avgCo2 + (Math.random() - 0.5) * 30),
    avgAmmonia: +(base.avgAmmonia + (Math.random() - 0.5) * 0.1).toFixed(2),
    avgEthylene: +(base.avgEthylene + (Math.random() - 0.5) * 0.6).toFixed(1),
  }));
}

export function useSensorRealtime(locaId: string | null) {
  const [currentReadings, setCurrentReadings] = useState<Array<{ bigBagId: string; reading: SensorReading }>>([]);
  const [history, setHistory] = useState<SensorHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useLocaDispatch();
  const { selectedDepotId } = useLocaState();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!locaId) return;
    try {
      const res = await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locaId, depotId: selectedDepotId }),
      });
      const data = await res.json();

      if (data.locaReadings) {
        setCurrentReadings(data.locaReadings);

        // Build history point from averages
        const readings = data.locaReadings as Array<{ bigBagId: string; reading: SensorReading }>;
        if (readings.length > 0) {
          const n = readings.length;
          const point: SensorHistoryPoint = {
            timestamp: new Date().toISOString(),
            avgTemp: parseFloat((readings.reduce((s, r) => s + r.reading.tempC, 0) / n).toFixed(2)),
            avgHumidity: parseFloat((readings.reduce((s, r) => s + r.reading.humidity, 0) / n).toFixed(1)),
            avgCo2: Math.round(readings.reduce((s, r) => s + r.reading.co2ppm, 0) / n),
            avgAmmonia: parseFloat((readings.reduce((s, r) => s + r.reading.ammoniaPpm, 0) / n).toFixed(2)),
            avgEthylene: parseFloat((readings.reduce((s, r) => s + r.reading.ethylenePpb, 0) / n).toFixed(1)),
          };
          setHistory(prev => {
            if (prev.length === 0) {
              const backfill = generateBackfill(point, 15);
              return [...backfill, point];
            }
            return [...prev, point].slice(-MAX_HISTORY);
          });
        }
      }

      if (data.locaRisks) {
        dispatch({ type: 'UPDATE_RISKS', risks: data.locaRisks });
      }

      setIsLoading(false);
    } catch {
      // fail-safe: don't crash UI
      setIsLoading(false);
    }
  }, [locaId, selectedDepotId, dispatch]);

  useEffect(() => {
    // Clear on locaId change
    setHistory([]);
    setCurrentReadings([]);
    setIsLoading(true);

    if (!locaId) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchData();

    // Poll
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [locaId, fetchData]);

  return { currentReadings, history, isLoading };
}
