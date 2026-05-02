import { NextResponse } from 'next/server';
import { getActions, addAction } from '@/lib/action-log';

export async function GET() {
  const actions = getActions(10);
  return NextResponse.json({ actions });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, locaId, locaNumber, description } = body;
    if (!type || !locaId || !description) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const action = addAction({ type, locaId, locaNumber: locaNumber ?? '', description });
    return NextResponse.json({ action });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
