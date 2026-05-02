import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 min cache

interface TobbPriceData {
  borsaAdi: string;
  tarih: string;
  enAz: number;
  enCok: number;
  ortalama: number;
  islemMiktariKg: number;
  source: 'live' | 'fallback';
}

const FALLBACK: TobbPriceData = {
  borsaAdi: 'Nevşehir Ticaret Borsası',
  tarih: new Date().toISOString(),
  enAz: 4.0,
  enCok: 15.0,
  ortalama: 6.86,
  islemMiktariKg: 9_354_827,
  source: 'fallback',
};

function parseNumber(raw: string): number {
  // "6,860" → 6.86   "4,000" → 4.0   "9.354.827" → 9354827
  const cleaned = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function GET() {
  try {
    const res = await fetch(
      'https://borsa.tobb.org.tr/fiyat_urun3.php?ana_kod=8&alt_kod=102',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LOCA-Dashboard/1.0)',
          Accept: 'text/html',
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(FALLBACK);
    }

    const html = await res.text();

    // Extract first data row from table
    // Pattern: find <td> cells after header row
    const rowMatch = html.match(/<tr[^>]*>\s*<td[^>]*>[\s\S]*?<\/tr>/gi);
    if (!rowMatch || rowMatch.length < 2) {
      return NextResponse.json(FALLBACK);
    }

    // Skip header row, get first data row
    const dataRow = rowMatch[1];
    const cellMatches = dataRow.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!cellMatches || cellMatches.length < 6) {
      return NextResponse.json(FALLBACK);
    }

    const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').trim();

    const data: TobbPriceData = {
      borsaAdi: stripTags(cellMatches[0]),
      tarih: stripTags(cellMatches[1]),
      enAz: parseNumber(stripTags(cellMatches[2])),
      enCok: parseNumber(stripTags(cellMatches[3])),
      ortalama: parseNumber(stripTags(cellMatches[4])),
      islemMiktariKg: parseNumber(stripTags(cellMatches[5])),
      source: 'live',
    };

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
