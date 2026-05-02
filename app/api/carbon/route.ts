import { NextRequest, NextResponse } from 'next/server';
import { calculateCarbonChain, SegmentInput } from '@/lib/carbon-chain-calc';

export async function POST(req: NextRequest) {
  try {
    const body: { segments: SegmentInput[] } = await req.json();
    const result = await calculateCarbonChain(body.segments);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Carbon calc failed', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
