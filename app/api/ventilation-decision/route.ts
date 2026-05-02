import { NextResponse } from 'next/server';
import { getReadingsForLoca, isDriftActive, getDriftPhase, getActiveDrift } from '@/lib/simulator';
import { decideVentilation } from '@/lib/ventilation-decision';
import { addAction, shouldLogPhase, clearPhaseLog } from '@/lib/action-log';
import { varieties } from '@/lib/seed/varieties';
import { depots } from '@/lib/seed/depots';
import type { SensorReading } from '@/lib/types';

function avgReadings(readings: Array<{ bigBagId: string; reading: SensorReading }>): SensorReading {
  if (readings.length === 0) {
    return { tempC: 0, humidity: 0, co2ppm: 0, ammoniaPpm: 0, ethylenePpb: 0, lastUpdate: new Date().toISOString() };
  }
  const n = readings.length;
  return {
    tempC: parseFloat((readings.reduce((s, r) => s + r.reading.tempC, 0) / n).toFixed(2)),
    humidity: parseFloat((readings.reduce((s, r) => s + r.reading.humidity, 0) / n).toFixed(1)),
    co2ppm: Math.round(readings.reduce((s, r) => s + r.reading.co2ppm, 0) / n),
    ammoniaPpm: parseFloat((readings.reduce((s, r) => s + r.reading.ammoniaPpm, 0) / n).toFixed(2)),
    ethylenePpb: parseFloat((readings.reduce((s, r) => s + r.reading.ethylenePpb, 0) / n).toFixed(1)),
    lastUpdate: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { locaId } = body;

    if (!locaId) {
      return NextResponse.json({ error: 'locaId required' }, { status: 400 });
    }

    let foundLoca = null;
    let foundDepot = null;
    for (const depot of depots) {
      const loca = depot.locas.find(l => l.id === locaId);
      if (loca) {
        foundLoca = loca;
        foundDepot = depot;
        break;
      }
    }

    if (!foundLoca || !foundDepot) {
      return NextResponse.json({ error: 'Loca not found' }, { status: 404 });
    }

    const variety = varieties.find(v => v.id === foundLoca.varietyId);
    if (!variety) {
      return NextResponse.json({ error: 'Variety not found' }, { status: 404 });
    }

    const readings = getReadingsForLoca(locaId);
    const internal = avgReadings(readings);

    // External weather
    let external = { tempC: 14, humidity: 15, precipitation: false, windKmh: 8 };
    try {
      const [lat, lon] = foundDepot.coordinates;
      const weatherRes = await fetch(`${getBaseUrl(req)}/api/weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon }),
      });
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        external = {
          tempC: weatherData.tempC,
          humidity: weatherData.humidity,
          precipitation: weatherData.precipitation,
          windKmh: weatherData.windKmh,
        };
      }
    } catch {
      // Use fallback
    }

    const driftActive = isDriftActive(locaId);
    const driftPhase = getDriftPhase(locaId);
    const activeDrift = getActiveDrift(locaId);

    const decision = decideVentilation({
      locaId,
      locaNumber: foundLoca.number,
      internal,
      external,
      variety,
      hasChiller: foundDepot.hasChiller,
      anomalyType: activeDrift?.anomalyType,
    });

    // Log action on phase transitions (deduped — only once per phase per loca)
    if (driftPhase === 'detected' && shouldLogPhase(locaId, 'detected')) {
      addAction({
        type: 'detection',
        locaId,
        locaNumber: foundLoca.number,
        description: `Anomali algılandı — ${activeDrift?.anomalyType ?? 'bilinmeyen'} tipi`,
        anomalyType: activeDrift?.anomalyType,
      });
    }

    if (driftPhase === 'acting' && driftActive && shouldLogPhase(locaId, 'acting')) {
      addAction({
        type: 'ventilation',
        locaId,
        locaNumber: foundLoca.number,
        description: `${decision.actionLabel ?? 'Aksiyon'} — ${decision.reasoning?.slice(0, 60)}`,
        anomalyType: activeDrift?.anomalyType,
      });
    }

    // Clear phase log when anomaly resolved or inactive — allows next anomaly to log fresh
    if (!driftPhase || driftPhase === 'inactive' || driftPhase === 'resolved') {
      clearPhaseLog(locaId);
    }

    // Timing info
    const now = Date.now();
    const timing = activeDrift ? {
      totalDuration: activeDrift.endTime - activeDrift.startTime,
      elapsed: now - activeDrift.startTime,
      phaseEndsIn: getPhaseEndTime(driftPhase, activeDrift) - now,
      startTime: activeDrift.startTime,
    } : null;

    return NextResponse.json({
      ...decision,
      driftActive,
      driftPhase,
      anomalyType: activeDrift?.anomalyType ?? null,
      timing,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error', detail: String(err) }, { status: 500 });
  }
}

function getBaseUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function getPhaseEndTime(phase: string, drift: { rampEnd: number; holdEnd: number; detectedTime: number; actionEnd: number; endTime: number }): number {
  switch (phase) {
    case 'ramping': return drift.rampEnd;
    case 'holding': return drift.holdEnd;
    case 'detected': return drift.detectedTime;
    case 'acting': return drift.actionEnd;
    case 'recovering': return drift.endTime;
    default: return drift.endTime;
  }
}
