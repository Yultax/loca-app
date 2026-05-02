export interface RateResponse {
  rates: { USD_TRY: number; EUR_TRY: number };
  updatedAt: string;
  source: 'EVDS' | 'fallback-xml' | 'cache' | 'hardcoded';
}

let cache: RateResponse | null = null;

export async function fetchTcmbRates(): Promise<RateResponse> {
  // Primary: EVDS API
  if (process.env.TCMB_API_KEY) {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

      const url = `https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.A-TP.DK.EUR.A&startDate=${fmt(weekAgo)}&endDate=${fmt(today)}&type=json`;
      const res = await fetch(url, {
        headers: { key: process.env.TCMB_API_KEY },
        next: { revalidate: 60 },
      });

      if (!res.ok) throw new Error(`EVDS ${res.status}`);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) throw new Error('EVDS returned non-JSON');

      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      return result;
    } catch (e) {
      console.warn('EVDS failed, trying XML fallback', e);
    }
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
    return result;
  } catch (e) {
    console.error('Both TCMB sources failed', e);
  }

  // Last resort: cache
  if (cache) {
    return { ...cache, source: 'cache' };
  }

  // Hardcoded fallback
  return {
    rates: { USD_TRY: 34.5, EUR_TRY: 37.8 },
    updatedAt: new Date().toISOString(),
    source: 'hardcoded',
  };
}
