import { NextResponse } from 'next/server';
import { fetchTcmbRates } from '@/lib/tcmb-fetcher';

export const revalidate = 60;

export async function GET() {
  const result = await fetchTcmbRates();

  if (result.source === 'hardcoded') {
    return NextResponse.json(
      { error: 'TCMB ulasilamiyor', fallback: result.rates },
      { status: 200 }
    );
  }

  return NextResponse.json(result);
}
