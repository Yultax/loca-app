import { NextResponse } from 'next/server';
import { tick, getReadingsForLoca } from '@/lib/simulator';
import { calculateFireRisk, statusFromRisk } from '@/lib/risk-score';
import { varieties } from '@/lib/seed/varieties';
import { depots } from '@/lib/seed/depots';
import type { SensorReading } from '@/lib/types';

function avgReadings(readings: Array<{ bigBagId: string; reading: SensorReading }>): SensorReading {
  if (readings.length === 0) {
    return { tempC: 0, humidity: 0, co2ppm: 0, ammoniaPpm: 0, ethylenePpb: 0, lastUpdate: new Date().toISOString() };
  }
  const sum = readings.reduce(
    (acc, r) => ({
      tempC: acc.tempC + r.reading.tempC,
      humidity: acc.humidity + r.reading.humidity,
      co2ppm: acc.co2ppm + r.reading.co2ppm,
      ammoniaPpm: acc.ammoniaPpm + r.reading.ammoniaPpm,
      ethylenePpb: acc.ethylenePpb + r.reading.ethylenePpb,
    }),
    { tempC: 0, humidity: 0, co2ppm: 0, ammoniaPpm: 0, ethylenePpb: 0 }
  );
  const n = readings.length;
  return {
    tempC: parseFloat((sum.tempC / n).toFixed(2)),
    humidity: parseFloat((sum.humidity / n).toFixed(1)),
    co2ppm: Math.round(sum.co2ppm / n),
    ammoniaPpm: parseFloat((sum.ammoniaPpm / n).toFixed(2)),
    ethylenePpb: parseFloat((sum.ethylenePpb / n).toFixed(1)),
    lastUpdate: new Date().toISOString(),
  };
}

function daysInStorage(fillDate: string | null): number {
  if (!fillDate) return 0;
  return Math.floor((Date.now() - new Date(fillDate).getTime()) / (1000 * 60 * 60 * 24));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { locaId, depotId } = body;

  const updates = tick();

  // Calculate risks for the selected depot's locas
  const targetDepotId = depotId ?? depots[0].id;
  const depot = depots.find(d => d.id === targetDepotId);
  const locaRisks: Array<{ locaId: string; fireRiskScore: number; status: 'optimal' | 'warning' | 'critical' }> = [];

  if (depot) {
    for (const loca of depot.locas) {
      if (!loca.varietyId || loca.bigBags.length === 0) continue;
      const variety = varieties.find(v => v.id === loca.varietyId);
      if (!variety) continue;

      const readings = getReadingsForLoca(loca.id);
      const avg = avgReadings(readings);
      const score = calculateFireRisk({
        avgReading: avg,
        variety,
        daysInStorage: daysInStorage(loca.fillDate),
      });
      const status = statusFromRisk(score);
      locaRisks.push({ locaId: loca.id, fireRiskScore: score, status });
    }
  }

  if (locaId) {
    const locaReadings = getReadingsForLoca(locaId);
    return NextResponse.json({
      tickCount: updates.length,
      locaReadings,
      locaRisks,
    });
  }

  return NextResponse.json({
    tickCount: updates.length,
    sample: updates.slice(0, 5),
    locaRisks,
  });
}
