export const EMISSION_FACTORS = {
  truck: 0.100,  // kg CO₂ / ton-km
  rail: 0.030,
  sea: 0.015,
  air: 0.500,
} as const;

export const CBAM_PRICE_EUR_PER_TON_CO2 = 80;

export function calculateCO2(
  distanceKm: number,
  weightTon: number,
  mode: keyof typeof EMISSION_FACTORS = 'truck'
): number {
  return distanceKm * weightTon * EMISSION_FACTORS[mode];
}

export function cbamCost(co2kg: number): number {
  return (co2kg / 1000) * CBAM_PRICE_EUR_PER_TON_CO2;
}
