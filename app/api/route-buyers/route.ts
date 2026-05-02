import { NextRequest, NextResponse } from 'next/server';
import { findTopBuyers } from '@/lib/route-buyers';

export async function POST(req: NextRequest) {
  try {
    const { locaId } = await req.json();
    const result = await findTopBuyers(locaId);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const status = message.includes('bulunamadi') || message.includes('yok') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
