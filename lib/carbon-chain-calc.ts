import { calculateCO2, cbamCost, EMISSION_FACTORS } from '@/lib/carbon-calc';
import { fetchTcmbRates } from '@/lib/tcmb-fetcher';

export interface SegmentInput {
  label: string;
  origin: { name: string; coords: [number, number] };
  destination: { name: string; coords: [number, number] };
  weightTon: number;
  soilPercent?: number;
  mode?: keyof typeof EMISSION_FACTORS;
}

export interface CarbonChainResult {
  segments: Array<{
    label: string;
    origin: { name: string; coords: [number, number] };
    destination: { name: string; coords: [number, number] };
    distanceKm: number;
    weightTon: number;
    soilWasteTon?: number;
    mode: string;
    emissionFactor: number;
    co2kg: number;
  }>;
  totalCO2kg: number;
  cbamCostEUR: number;
  cbamCostTRY: number;
  fxRate: { pair: string; rate: number; updatedAt: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routeGeoJSON: any;
}

// In-memory ORS cache — origin+dest key, 10min TTL
const orsCache = new Map<string, { data: { distanceKm: number }; geometry: unknown; ts: number }>();
const ORS_CACHE_TTL = 10 * 60 * 1000;

function cacheKey(origin: [number, number], dest: [number, number]): string {
  return `${origin[0]},${origin[1]}->${dest[0]},${dest[1]}`;
}

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function calculateCarbonChain(inputSegments: SegmentInput[]): Promise<CarbonChainResult> {
  const tcmb = await fetchTcmbRates();
  const eurTry = tcmb.rates.EUR_TRY;

  const segments = await Promise.all(
    inputSegments.map(async (seg) => {
      const key = cacheKey(seg.origin.coords, seg.destination.coords);
      const mode = seg.mode || 'truck';
      let distanceKm: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let geometry: any = null;

      const cached = orsCache.get(key);
      if (cached && Date.now() - cached.ts < ORS_CACHE_TTL) {
        distanceKm = cached.data.distanceKm;
        geometry = cached.geometry;
      } else {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

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
                  [seg.origin.coords[1], seg.origin.coords[0]],
                  [seg.destination.coords[1], seg.destination.coords[0]],
                ],
                instructions: false,
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeout);

          if (!orsRes.ok) {
            throw new Error(`ORS ${orsRes.status}`);
          }

          const orsData = await orsRes.json();
          distanceKm = orsData.features[0].properties.summary.distance / 1000;
          geometry = orsData.features[0].geometry;

          orsCache.set(key, { data: { distanceKm }, geometry, ts: Date.now() });
        } catch (e) {
          console.warn('ORS failed, using haversine fallback', e);
          distanceKm = haversineKm(
            seg.origin.coords[0], seg.origin.coords[1],
            seg.destination.coords[0], seg.destination.coords[1]
          ) * 1.3;
          geometry = null;
        }
      }

      const co2kg = calculateCO2(distanceKm, seg.weightTon, mode);
      const soilWasteTon = seg.soilPercent
        ? seg.weightTon * seg.soilPercent / 100
        : 0;
      const soilCO2 = soilWasteTon
        ? calculateCO2(distanceKm, soilWasteTon, mode)
        : 0;

      return {
        label: seg.label,
        origin: seg.origin,
        destination: seg.destination,
        distanceKm: parseFloat(distanceKm.toFixed(1)),
        weightTon: seg.weightTon,
        soilWasteTon: soilWasteTon ? parseFloat(soilWasteTon.toFixed(2)) : undefined,
        mode,
        emissionFactor: EMISSION_FACTORS[mode],
        co2kg: parseFloat((co2kg + soilCO2).toFixed(2)),
        geometry,
      };
    })
  );

  const totalCO2kg = segments.reduce((sum, s) => sum + s.co2kg, 0);
  const cbamCostEUR = cbamCost(totalCO2kg);

  const routeGeoJSON = {
    type: 'FeatureCollection' as const,
    features: segments
      .filter((s) => s.geometry)
      .map((s) => ({
        type: 'Feature' as const,
        properties: { label: s.label },
        geometry: s.geometry,
      })),
  };

  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    segments: segments.map(({ geometry: _geo, ...rest }) => rest),
    totalCO2kg: parseFloat(totalCO2kg.toFixed(2)),
    cbamCostEUR: parseFloat(cbamCostEUR.toFixed(2)),
    cbamCostTRY: parseFloat((cbamCostEUR * eurTry).toFixed(2)),
    fxRate: {
      pair: 'EUR/TRY',
      rate: eurTry,
      updatedAt: tcmb.updatedAt,
    },
    routeGeoJSON,
  };
}
