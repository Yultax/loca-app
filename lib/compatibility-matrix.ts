import { varieties } from './seed/varieties';
import { depots } from './seed/depots';
import type { ProductType, Loca, ResidueProfile } from './types';

export type CompatProductType =
  | 'potato-seed' | 'potato-table' | 'potato-crisping' | 'potato-french_fry'
  | 'lemon' | 'apple' | 'onion' | 'legume' | 'cheese';

export interface CompatResult {
  fromProduct: CompatProductType;
  toProduct: CompatProductType;
  compatible: 'yes' | 'caution' | 'no';
  reason: string;
  alternativeAction?: string;
}

interface MatrixRule {
  from: string; // regex-like pattern: 'potato-*' or exact
  to: string;
  compatible: 'yes' | 'caution' | 'no';
  reason: string;
  alternativeAction?: string;
}

const MATRIX_RULES: MatrixRule[] = [
  // potato-seed NEVER mixes with other potato types (Doga Tohumculuk standard)
  { from: 'potato-seed', to: 'potato-table', compatible: 'no', reason: 'Hastalik riski — tohum sanayilik ile asla birlestirilmez (Doga Tohumculuk standardi)', alternativeAction: 'Farkli depo bolmesi kullanin' },
  { from: 'potato-seed', to: 'potato-crisping', compatible: 'no', reason: 'Hastalik riski — tohum sanayilik ile asla birlestirilmez (Doga Tohumculuk standardi)', alternativeAction: 'Farkli depo bolmesi kullanin' },
  { from: 'potato-seed', to: 'potato-french_fry', compatible: 'no', reason: 'Hastalik riski — tohum sanayilik ile asla birlestirilmez (Doga Tohumculuk standardi)', alternativeAction: 'Farkli depo bolmesi kullanin' },
  { from: 'potato-table', to: 'potato-seed', compatible: 'no', reason: 'Sanayilikten tohum alinmaz, kalite garantisi yok', alternativeAction: 'Farkli depo bolmesi kullanin' },
  { from: 'potato-crisping', to: 'potato-seed', compatible: 'no', reason: 'Sanayilikten tohum alinmaz, kalite garantisi yok', alternativeAction: 'Farkli depo bolmesi kullanin' },
  { from: 'potato-french_fry', to: 'potato-seed', compatible: 'no', reason: 'Sanayilikten tohum alinmaz, kalite garantisi yok', alternativeAction: 'Farkli depo bolmesi kullanin' },

  // potato-* → non-potato
  { from: 'potato-*', to: 'lemon', compatible: 'no', reason: 'Patates etilen rezidüsü, limon raf ömrü -%30' },
  { from: 'potato-*', to: 'apple', compatible: 'no', reason: 'Etilen + nem uyumsuzlugu' },
  { from: 'potato-*', to: 'onion', compatible: 'caution', reason: 'Karsilikli koku transferi riski', alternativeAction: 'Havalandirma + temizlik sonrasi tekrar degerlendirin' },
  { from: 'potato-*', to: 'legume', compatible: 'yes', reason: 'Yuksek etilen toleransi' },
  { from: 'potato-*', to: 'cheese', compatible: 'no', reason: 'Nem/sicaklik araligi catismasi' },

  // non-potato → potato-*
  { from: 'lemon', to: 'potato-*', compatible: 'caution', reason: 'Sicaklik araligi uyumsuzlugu (limon 12-15°C)', alternativeAction: 'Sicaklik kalibrasyon kontrolu yapin' },

  // potato-table/crisping/fry cross-types
  { from: 'potato-table', to: 'potato-crisping', compatible: 'caution', reason: 'Sicaklik araligi eslesmesi kontrol edilmeli' },
  { from: 'potato-table', to: 'potato-french_fry', compatible: 'caution', reason: 'Sicaklik araligi eslesmesi kontrol edilmeli' },
  { from: 'potato-crisping', to: 'potato-table', compatible: 'caution', reason: 'Sicaklik araligi eslesmesi kontrol edilmeli' },
  { from: 'potato-crisping', to: 'potato-french_fry', compatible: 'caution', reason: 'Sicaklik araligi eslesmesi kontrol edilmeli' },
  { from: 'potato-french_fry', to: 'potato-table', compatible: 'caution', reason: 'Sicaklik araligi eslesmesi kontrol edilmeli' },
  { from: 'potato-french_fry', to: 'potato-crisping', compatible: 'caution', reason: 'Sicaklik araligi eslesmesi kontrol edilmeli' },

  // Same type, different variety
  { from: 'potato-table', to: 'potato-table', compatible: 'caution', reason: 'Sicaklik araligi eslesmesi kontrol edilmeli' },
];

function matchPattern(pattern: string, value: string): boolean {
  if (pattern === value) return true;
  if (pattern.endsWith('-*')) {
    const prefix = pattern.slice(0, -1);
    return value.startsWith(prefix);
  }
  return false;
}

export function getCompatType(productType: ProductType, varietyId?: string): CompatProductType {
  if (productType === 'potato') {
    if (varietyId) {
      const v = varieties.find(v => v.id === varietyId);
      if (v) return `potato-${v.useType}` as CompatProductType;
    }
    return 'potato-table';
  }
  return productType as CompatProductType;
}

export function checkCompatibility(
  fromCompat: CompatProductType,
  toCompat: CompatProductType,
  residueProfile: ResidueProfile
): CompatResult {
  // Find matching rule — specific rules first (they're ordered that way in the array)
  for (const rule of MATRIX_RULES) {
    if (matchPattern(rule.from, fromCompat) && matchPattern(rule.to, toCompat)) {
      let reason = rule.reason;
      // Enhance reason with actual residue readings
      if (residueProfile.ethyleneRemnant > 0) {
        reason += ` (Etilen rezidüsü: ${residueProfile.ethyleneRemnant} ppb)`;
      }
      if (residueProfile.ammoniaRemnant > 0) {
        reason += ` (Amonyak rezidüsü: ${residueProfile.ammoniaRemnant} ppm)`;
      }
      return {
        fromProduct: fromCompat,
        toProduct: toCompat,
        compatible: rule.compatible,
        reason,
        alternativeAction: rule.alternativeAction,
      };
    }
  }

  // No explicit rule → default compatible
  return {
    fromProduct: fromCompat,
    toProduct: toCompat,
    compatible: 'yes',
    reason: 'Uyumluluk sorunu tespit edilmedi',
  };
}

export function findAlternativeLocas(
  depotLocas: Loca[],
  targetProduct: CompatProductType
): Loca[] {
  return depotLocas
    .filter(l => !l.varietyId && l.currentLoadTon === 0)
    .filter(l => {
      const fromCompat = getCompatType(
        l.residueProfile.lastProducts[0]?.productType ?? 'potato',
        undefined
      );
      const result = checkCompatibility(fromCompat, targetProduct, l.residueProfile);
      return result.compatible !== 'no';
    })
    .sort((a, b) => a.residueProfile.ethyleneRemnant - b.residueProfile.ethyleneRemnant);
}

export function findAlternativeLocasAllDepots(
  targetProduct: CompatProductType
): Array<{ loca: Loca; depotName: string }> {
  const results: Array<{ loca: Loca; depotName: string }> = [];
  for (const depot of depots) {
    const alternatives = findAlternativeLocas(depot.locas, targetProduct);
    for (const loca of alternatives) {
      results.push({ loca, depotName: depot.name });
    }
  }
  return results.sort((a, b) =>
    a.loca.residueProfile.ethyleneRemnant - b.loca.residueProfile.ethyleneRemnant
  );
}
