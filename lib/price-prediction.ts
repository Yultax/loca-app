import { varieties } from './seed/varieties';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getSeasonalMultiplier(daysFromNow: number): number {
  const target = new Date();
  target.setDate(target.getDate() + daysFromNow);
  const month = target.getMonth(); // 0-indexed

  // Oct(9)-Nov(10) = -10%, Dec(11)-Feb(2) = baseline, Mar(3)-May(5) = +15%, Jun(6)-Sep(8) = -5%
  if (month >= 9 && month <= 10) return -0.10;
  if (month >= 3 && month <= 5) return 0.15;
  if (month >= 6 && month <= 8) return -0.05;
  return 0; // Dec-Feb baseline
}

export function dailyNoise(varietyId: string, daysFromNow: number): number {
  const target = new Date();
  target.setDate(target.getDate() + daysFromNow);
  const dateStr = target.toISOString().slice(0, 10);
  const hash = hashStr(`${varietyId}-${dateStr}`);
  // Deterministic ±0.3%
  return ((hash % 600) - 300) / 100000;
}

export function predictPrice(
  varietyId: string,
  daysFromNow: number
): { priceTRY: number; multiplier: number } {
  const variety = varieties.find((v) => v.id === varietyId);
  const basePriceTRY = variety?.marketPriceTRY ?? 12;

  const seasonal = getSeasonalMultiplier(daysFromNow);
  const noise = dailyNoise(varietyId, daysFromNow);
  const multiplier = 1 + seasonal + noise;
  const priceTRY = basePriceTRY * multiplier;

  return {
    priceTRY: parseFloat(priceTRY.toFixed(2)),
    multiplier: parseFloat(multiplier.toFixed(4)),
  };
}
