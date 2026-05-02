import { NextResponse } from 'next/server';

interface WeatherCache {
  data: WeatherResponse;
  expires: number;
}

interface WeatherResponse {
  tempC: number;
  humidity: number;
  precipitation: boolean;
  windKmh: number;
  description: string;
  source: 'live' | 'cache' | 'fallback';
  updatedAt: string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, WeatherCache>();

const FALLBACK: WeatherResponse = {
  tempC: 14,
  humidity: 15,
  precipitation: false,
  windKmh: 8,
  description: 'Açık (fallback)',
  source: 'fallback',
  updatedAt: new Date().toISOString(),
};

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { lat, lon } = body;

    if (!lat || !lon) {
      return NextResponse.json({ error: 'lat and lon required', ...FALLBACK });
    }

    const key = cacheKey(lat, lon);
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ ...cached.data, source: 'cache' as const });
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&timezone=Europe/Istanbul`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

    const json = await res.json();
    const current = json.current;

    const data: WeatherResponse = {
      tempC: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation > 0,
      windKmh: current.wind_speed_10m,
      description: weatherCodeToText(current.weather_code),
      source: 'live',
      updatedAt: new Date().toISOString(),
    };

    cache.set(key, { data, expires: Date.now() + CACHE_TTL });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}

function weatherCodeToText(code: number): string {
  if (code === 0) return 'Açık';
  if (code <= 3) return 'Parçalı bulutlu';
  if (code <= 48) return 'Sisli';
  if (code <= 57) return 'Çisenti';
  if (code <= 67) return 'Yağmurlu';
  if (code <= 77) return 'Karlı';
  if (code <= 82) return 'Sağanak';
  if (code <= 86) return 'Kar yağışlı';
  if (code <= 99) return 'Gök gürültülü fırtına';
  return 'Bilinmiyor';
}
