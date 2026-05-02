import type { LocaStatus, PotatoVariety, SensorReading } from './types';

export interface RiskInput {
  avgReading: SensorReading;
  variety: PotatoVariety;
  daysInStorage: number;
}

export function calculateFireRisk(input: RiskInput): number {
  const { avgReading, variety, daysInStorage } = input;
  const [tMin, tMax] = variety.optimalTempC;
  const [hMin, hMax] = variety.optimalHumidity;
  const coMax = variety.optimalCo2ppm[1];

  // tempDev: distance outside optimal range × 20, clamp 0-100
  const tempDev = avgReading.tempC < tMin
    ? (tMin - avgReading.tempC) * 20
    : avgReading.tempC > tMax
      ? (avgReading.tempC - tMax) * 20
      : 0;

  // humDev: same pattern × 5
  const humDev = avgReading.humidity < hMin
    ? (hMin - avgReading.humidity) * 5
    : avgReading.humidity > hMax
      ? (avgReading.humidity - hMax) * 5
      : 0;

  // co2Trend: (current - optimalMax) / optimalMax × 100
  const co2Trend = avgReading.co2ppm > coMax
    ? ((avgReading.co2ppm - coMax) / coMax) * 100
    : 0;

  // ammoniaSpike: current / threshold × 100
  const ammoniaSpike = (avgReading.ammoniaPpm / variety.ammoniaThresholdPpm) * 100;

  // ethyleneTrend: current / threshold × 100
  const ethyleneTrend = (avgReading.ethylenePpb / variety.ethyleneThresholdPpb) * 100;

  // dormancyRatio: daysInStorage / dormancyDays × 100
  const dormancyRatio = (daysInStorage / variety.dormancyDays) * 100;

  const score =
    0.15 * clamp(tempDev) +
    0.10 * clamp(humDev) +
    0.20 * clamp(co2Trend) +
    0.30 * clamp(ammoniaSpike) +
    0.15 * clamp(ethyleneTrend) +
    0.10 * clamp(dormancyRatio);

  return Math.round(Math.min(100, Math.max(0, score)));
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, v));
}

export function statusFromRisk(score: number): LocaStatus {
  if (score > 40) return 'critical';
  if (score > 25) return 'warning';
  return 'optimal';
}
