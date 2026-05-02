import { NextResponse } from 'next/server';
import { injectDrift } from '@/lib/simulator';
import { addAction } from '@/lib/action-log';
import { varieties } from '@/lib/seed/varieties';
import { depots } from '@/lib/seed/depots';
import type { AnomalyType } from '@/lib/types';

const ANOMALY_LABELS: Record<AnomalyType, string> = {
  temp_high: 'Sıcaklık Yükselişi',
  humidity_high: 'Nem Artışı',
  co2_spike: 'CO₂ Sivrilmesi',
  ammonia_spike: 'Amonyak Artışı',
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { locaId, anomalyType = 'temp_high' } = body as { locaId?: string; anomalyType?: AnomalyType };

    if (!locaId) {
      return NextResponse.json({ error: 'locaId required' }, { status: 400 });
    }

    let foundLoca = null;
    for (const depot of depots) {
      const loca = depot.locas.find(l => l.id === locaId);
      if (loca) {
        foundLoca = loca;
        break;
      }
    }

    if (!foundLoca) {
      return NextResponse.json({ error: 'Loca not found' }, { status: 404 });
    }

    const variety = varieties.find(v => v.id === foundLoca.varietyId);
    void variety;

    const drift = injectDrift(locaId, anomalyType);

    addAction({
      type: 'anomaly',
      locaId,
      locaNumber: foundLoca.number,
      description: `Anomali tetiklendi — ${ANOMALY_LABELS[anomalyType]} (demo)`,
      anomalyType,
    });

    return NextResponse.json({ success: true, drift, anomalyType });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error', detail: String(err) }, { status: 500 });
  }
}
