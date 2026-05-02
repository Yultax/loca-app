---
name: api-integrations
description: TCMB EVDS döviz kuru, OpenRouteService rota+karbon, Open-Meteo dış hava, Nominatim geocoding entegrasyonları. Bir API endpoint yazıldığı, dış servise istek yapıldığı, kur/mesafe/koordinat/hava verisi çekildiği her durumda bu skill'i oku. Server-side route handler örnekleri, error handling, fallback patterns, env variable kullanımı, cache stratejileri burada.
---

# LOCA API Integrations

Tüm dış API çağrıları **server-side**. API key client'a sızmaz. Her wrapper try-catch + fallback + cache içermeli.

## Genel Prensipler

1. Her endpoint Next.js Route Handler (`app/api/*/route.ts`)
2. `revalidate` ile cache (60 sn TCMB, 5 dk weather, 24 saat geocoding)
3. Error response: `{ error: string, fallback?: any }` formatında, 500 yerine 200 + fallback flag
4. Env variable: `process.env.TCMB_API_KEY` (server only, NEXT_PUBLIC_ prefix YOK)
5. UI'da "son güncelleme: HH:MM" + bağlantı yok uyarısı
6. Hardcoded değer YASAK — fallback bile cache'den gelecek

## TCMB EVDS — Kural 2

**Endpoint:** `app/api/tcmb/route.ts`

**Birincil:** EVDS API
```
GET https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.A-TP.DK.EUR.A&startDate=DD-MM-YYYY&endDate=DD-MM-YYYY&type=json
Headers: { key: TCMB_API_KEY }
```

⚠️ Önemli: `key` 5 Nisan 2024 itibarıyla **header'a taşındı**, URL'den değil header'dan gönderilecek.

**Fallback:** `https://www.tcmb.gov.tr/kurlar/today.xml` (key gerektirmez, public, daily)

**Implementation:**

```typescript
// app/api/tcmb/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 60;

interface RateResponse {
  rates: { USD_TRY: number; EUR_TRY: number };
  updatedAt: string;
  source: 'EVDS' | 'fallback-xml' | 'cache';
}

let cache: RateResponse | null = null;

export async function GET() {
  // Önce EVDS dene
  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 gün geri (boş günler için)
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;

    const url = `https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.A-TP.DK.EUR.A&startDate=${fmt(yesterday)}&endDate=${fmt(today)}&type=json`;
    const res = await fetch(url, {
      headers: { key: process.env.TCMB_API_KEY! },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`EVDS ${res.status}`);

    const data = await res.json();
    const items = data.items?.filter((i: any) => i.TP_DK_USD_A && i.TP_DK_EUR_A);
    const latest = items?.[items.length - 1];
    if (!latest) throw new Error('No EVDS data');

    const result: RateResponse = {
      rates: {
        USD_TRY: parseFloat(latest.TP_DK_USD_A),
        EUR_TRY: parseFloat(latest.TP_DK_EUR_A),
      },
      updatedAt: latest.Tarih,
      source: 'EVDS',
    };
    cache = result;
    return NextResponse.json(result);
  } catch (e) {
    console.warn('EVDS failed, trying XML fallback', e);
  }

  // Fallback: TCMB today.xml
  try {
    const res = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
      next: { revalidate: 60 },
    });
    const xml = await res.text();
    const usdMatch = xml.match(/<Currency[^>]+CurrencyCode="USD"[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>/);
    const eurMatch = xml.match(/<Currency[^>]+CurrencyCode="EUR"[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>/);

    if (!usdMatch || !eurMatch) throw new Error('XML parse failed');

    const result: RateResponse = {
      rates: {
        USD_TRY: parseFloat(usdMatch[1]),
        EUR_TRY: parseFloat(eurMatch[1]),
      },
      updatedAt: new Date().toISOString(),
      source: 'fallback-xml',
    };
    cache = result;
    return NextResponse.json(result);
  } catch (e) {
    console.error('Both TCMB sources failed', e);
  }

  // Son çare: cache'den dön
  if (cache) {
    return NextResponse.json({ ...cache, source: 'cache' });
  }

  return NextResponse.json(
    { error: 'TCMB ulaşılamıyor', fallback: { USD_TRY: 34.5, EUR_TRY: 37.8 } },
    { status: 200 }
  );
}
```

**Hook:**

```typescript
// hooks/use-tcmb-rate.ts
'use client';
import useSWR from 'swr';

export function useTcmbRate() {
  const { data, error } = useSWR('/api/tcmb', (url) => fetch(url).then(r => r.json()), {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });
  return { rate: data, isLoading: !data && !error, isError: error };
}
```

## OpenRouteService — Kural 1 + 3

**Endpoint:** `app/api/carbon/route.ts`

ORS API key alma: `https://openrouteservice.org/dev/#/signup` (anlık, ücretsiz, 2000 req/gün).

**Driving-HGV profili** = TIR'a en yakın. `driving-car` yerine BU kullanılmalı.

```typescript
// lib/carbon-calc.ts
export const EMISSION_FACTORS = {
  truck: 0.100,    // kg CO₂ / ton-km
  rail: 0.030,
  sea: 0.015,
  air: 0.500,
} as const;

export const CBAM_PRICE_EUR_PER_TON_CO2 = 80; // 2026 başlangıç tarifesi

export function calculateCO2(distanceKm: number, weightTon: number, mode: keyof typeof EMISSION_FACTORS = 'truck') {
  return distanceKm * weightTon * EMISSION_FACTORS[mode];
}

export function cbamCost(co2kg: number) {
  return (co2kg / 1000) * CBAM_PRICE_EUR_PER_TON_CO2;
}
```

```typescript
// app/api/carbon/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calculateCO2, cbamCost, EMISSION_FACTORS } from '@/lib/carbon-calc';

interface Body {
  segments: Array<{
    label: string;
    origin: { name: string; coords: [number, number] };  // [lat, lng]
    destination: { name: string; coords: [number, number] };
    weightTon: number;
    soilPercent?: number;
    mode?: keyof typeof EMISSION_FACTORS;
  }>;
}

export async function POST(req: NextRequest) {
  const body: Body = await req.json();

  try {
    // TCMB kur çek (kendi endpoint'imizi çağır)
    const tcmbRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tcmb`);
    const tcmbData = await tcmbRes.json();
    const eurTry = tcmbData.rates?.EUR_TRY ?? 37.8;

    // Her segment için ORS rotası al
    const segments = await Promise.all(body.segments.map(async (seg) => {
      const orsRes = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-hgv/geojson',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: process.env.ORS_API_KEY!,
          },
          body: JSON.stringify({
            coordinates: [
              [seg.origin.coords[1], seg.origin.coords[0]],   // ORS lng,lat ister!
              [seg.destination.coords[1], seg.destination.coords[0]],
            ],
            instructions: false,
          }),
        }
      );

      if (!orsRes.ok) {
        const text = await orsRes.text();
        throw new Error(`ORS ${orsRes.status}: ${text}`);
      }

      const orsData = await orsRes.json();
      const distanceKm = orsData.features[0].properties.summary.distance / 1000;
      const co2kg = calculateCO2(distanceKm, seg.weightTon, seg.mode || 'truck');

      // Toprak yüzdesi ekstra emisyonu
      const soilWasteTon = seg.soilPercent ? (seg.weightTon * seg.soilPercent / 100) : 0;
      const soilCO2 = soilWasteTon ? calculateCO2(distanceKm, soilWasteTon, seg.mode || 'truck') : 0;

      return {
        ...seg,
        distanceKm,
        co2kg: co2kg + soilCO2,
        soilWasteTon,
        emissionFactor: EMISSION_FACTORS[seg.mode || 'truck'],
        geometry: orsData.features[0].geometry,
      };
    }));

    const totalCO2kg = segments.reduce((sum, s) => sum + s.co2kg, 0);
    const cbamEUR = cbamCost(totalCO2kg);

    return NextResponse.json({
      segments,
      totalCO2kg,
      cbamCostEUR: cbamEUR,
      cbamCostTRY: cbamEUR * eurTry,
      fxRate: { pair: 'EUR/TRY', rate: eurTry, updatedAt: tcmbData.updatedAt },
    });
  } catch (e: any) {
    console.error('Carbon calc failed', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

## Open-Meteo — Dış Hava (Kural 3 ekstra)

Key gerektirmez, rate limit cömert (10k req/gün ücretsiz tier).

```typescript
// app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 300; // 5 dk

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat/lng gerekli' }, { status: 400 });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=Europe/Istanbul`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();

    return NextResponse.json({
      tempC: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation > 0,
      windKmh: data.current.wind_speed_10m,
      updatedAt: data.current.time,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, fallback: { tempC: 8, humidity: 65, precipitation: false, windKmh: 5 }}, { status: 200 });
  }
}
```

## Nominatim — Geocoding

Adres → koordinat. Key gerektirmez ama **User-Agent zorunlu** (rate limit korunması).

⚠️ Çağrı sıklığı: **maksimum 1 req/saniye**. Bulk operations için cache zorunlu.

```typescript
// lib/geocode.ts
const cache = new Map<string, [number, number]>();

export async function geocode(address: string): Promise<[number, number] | null> {
  if (cache.has(address)) return cache.get(address)!;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=tr`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LOCA-Hackathon-Cave2Cloud/1.0' },
      next: { revalidate: 86400 }, // 24 saat cache
    });
    const data = await res.json();
    if (!data?.[0]) return null;

    const result: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    cache.set(address, result);
    return result;
  } catch (e) {
    console.error('Geocoding failed', e);
    return null;
  }
}
```

## Hata Yönetimi Pattern

UI tarafta her external data fetch için 3 state:

```tsx
function StatusIndicator({ source, updatedAt }: { source?: string; updatedAt?: string }) {
  if (!source) return <span className="text-[hsl(var(--danger))] text-xs">⚠ Veri yok</span>;
  if (source === 'cache') return <span className="text-[hsl(var(--warning))] text-xs">📦 Önbellek - {timeAgo(updatedAt)}</span>;
  if (source === 'fallback-xml') return <span className="text-[hsl(var(--warning))] text-xs">↻ Yedek kaynak - {timeAgo(updatedAt)}</span>;
  return <span className="text-[hsl(var(--success))] text-xs">● Canlı - {timeAgo(updatedAt)}</span>;
}
```

## Env Variables Setup

`.env.local`:
```
TCMB_API_KEY=...
ORS_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Vercel'de `NEXT_PUBLIC_BASE_URL` otomatik `https://your-app.vercel.app` olur, manuel set et.

## Test Stratejisi

Hackathon → automated test yok. Manuel sanity check:

```bash
curl http://localhost:3000/api/tcmb              # USD/EUR canlı dönmeli
curl -X POST http://localhost:3000/api/carbon \  # ORS rota dönmeli
  -H "Content-Type: application/json" \
  -d '{"segments":[{"label":"test","origin":{"name":"Niğde","coords":[37.97,34.69]},"destination":{"name":"Aksaray","coords":[38.37,34.03]},"weightTon":14}]}'
curl 'http://localhost:3000/api/weather?lat=38.37&lng=34.03'
```

Hepsi 200 dönüyorsa entegrasyonlar tamam.
