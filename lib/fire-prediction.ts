export function riskMultiplier(currentFireRisk: number): number {
  if (currentFireRisk < 20) return 0.1;
  if (currentFireRisk < 40) return 0.3;
  if (currentFireRisk < 60) return 0.5;
  return 0.8;
}

export function projectedFire(currentFireRisk: number, days: number): number {
  const rm = riskMultiplier(currentFireRisk);
  const projected = currentFireRisk + days * 0.4 + rm * days;
  return parseFloat(Math.min(projected, 100).toFixed(1));
}
