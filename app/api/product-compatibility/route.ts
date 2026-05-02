import { NextResponse } from 'next/server';
import { depots } from '@/lib/seed/depots';
import {
  checkCompatibility,
  getCompatType,
  findAlternativeLocasAllDepots,
  type CompatProductType,
} from '@/lib/compatibility-matrix';

const VALID_TYPES: CompatProductType[] = [
  'potato-seed', 'potato-table', 'potato-crisping', 'potato-french_fry',
  'lemon', 'apple', 'onion', 'legume', 'cheese',
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locaId, newProduct } = body as { locaId: string; newProduct: CompatProductType };

    if (!locaId || !newProduct) {
      return NextResponse.json({ error: 'locaId ve newProduct zorunlu' }, { status: 400 });
    }

    if (!VALID_TYPES.includes(newProduct)) {
      return NextResponse.json({ error: 'Gecersiz urun tipi' }, { status: 400 });
    }

    // Find loca across all depots
    let foundLoca = null;
    for (const depot of depots) {
      const loca = depot.locas.find(l => l.id === locaId);
      if (loca) {
        foundLoca = loca;
        break;
      }
    }

    if (!foundLoca) {
      return NextResponse.json({ error: 'Loca bulunamadi' }, { status: 404 });
    }

    // Determine current product compatibility type from residue
    const fromCompat = getCompatType(
      foundLoca.residueProfile.lastProducts[0]?.productType ?? foundLoca.productType,
      foundLoca.varietyId ?? undefined
    );

    const compatibility = checkCompatibility(fromCompat, newProduct, foundLoca.residueProfile);

    let alternatives: Array<{
      locaId: string;
      number: string;
      depotName: string;
      ethyleneRemnant: number;
    }> | undefined;

    if (compatibility.compatible !== 'yes') {
      const altLocas = findAlternativeLocasAllDepots(newProduct);
      // Exclude current loca from alternatives
      alternatives = altLocas
        .filter(a => a.loca.id !== locaId)
        .slice(0, 5)
        .map(a => ({
          locaId: a.loca.id,
          number: a.loca.number,
          depotName: a.depotName,
          ethyleneRemnant: a.loca.residueProfile.ethyleneRemnant,
        }));
    }

    return NextResponse.json({ compatibility, alternatives });
  } catch {
    return NextResponse.json({ error: 'Sunucu hatasi' }, { status: 500 });
  }
}
