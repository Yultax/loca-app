import { Depot, Loca, BigBag, ProductType, LocaStatus, ResidueProfile, SensorReading, CVAnalysis } from '../types';
import { varieties } from './varieties';

// Deterministic pseudo-random based on string hash
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randomBetween(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function pickRandom<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const FARMER_IDS = ['farmer-1', 'farmer-2', 'farmer-3', 'farmer-4', 'farmer-5'];

function generateBigBags(locaId: string, varietyId: string, count: number, seed: number): BigBag[] {
  const rng = seededRandom(seed);
  const variety = varieties.find(v => v.id === varietyId);
  const bags: BigBag[] = [];

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const tier = Math.floor(i / 10) % 3;

    const tempBase = variety ? (variety.optimalTempC[0] + variety.optimalTempC[1]) / 2 : 7;
    const humBase = variety ? (variety.optimalHumidity[0] + variety.optimalHumidity[1]) / 2 : 92;

    const sensors: SensorReading = {
      tempC: parseFloat((tempBase + randomBetween(rng, -0.5, 0.5)).toFixed(1)),
      humidity: parseFloat((humBase + randomBetween(rng, -2, 2)).toFixed(1)),
      co2ppm: Math.round(2500 + randomBetween(rng, -500, 500)),
      ammoniaPpm: parseFloat((3 + randomBetween(rng, 0, 4)).toFixed(1)),
      ethylenePpb: parseFloat((10 + randomBetween(rng, 0, 20)).toFixed(1)),
      lastUpdate: new Date().toISOString(),
    };

    const cvAnalysis: CVAnalysis = {
      potatoCount: Math.round(randomBetween(rng, 8, 16)),
      sproutCount: Math.round(randomBetween(rng, 0, 3)),
      bruiseCount: Math.round(randomBetween(rng, 0, 2)),
      soilCoverage: parseFloat(randomBetween(rng, 1, 6).toFixed(1)),
      averageSizeMm: Math.round(randomBetween(rng, 40, 65)),
      sizeDistribution: { seed: 0.2, table: 0.6, baking: 0.2 },
      imageUrl: `/potato-images/sample-${(i % 6) + 1}.jpg`,
      thermalImageUrl: `/potato-images/thermal-${(i % 6) + 1}.jpg`,
      analysisTime: new Date().toISOString(),
    };

    const harvestDate = '2025-09-15';
    const harvestMs = new Date(harvestDate).getTime();
    const DAY = 86400000;
    const pesticideDaysBefore = Math.round(randomBetween(rng, 14, 30));
    const fertDaysBeforePesticide = Math.round(randomBetween(rng, 30, 60));
    const lastPesticideDate = new Date(harvestMs - pesticideDaysBefore * DAY).toISOString().split('T')[0];
    const lastFertilizationDate = new Date(harvestMs - (pesticideDaysBefore + fertDaysBeforePesticide) * DAY).toISOString().split('T')[0];
    const harvestToStorageDays = Math.round(randomBetween(rng, 1, 5));

    bags.push({
      id: `${locaId}-bb-${String(i + 1).padStart(3, '0')}`,
      locaId,
      variety: varietyId,
      weightKg: Math.round(randomBetween(rng, 900, 1100)),
      soilPercent: parseFloat(randomBetween(rng, 2, 7).toFixed(1)),
      harvestDate,
      farmerId: pickRandom(rng, FARMER_IDS),
      contractId: rng() > 0.5 ? `contract-${Math.ceil(rng() * 8)}` : null,
      positionInLoca: { row, col, tier },
      sensors,
      cvAnalysis,
      bruiseRiskScore: Math.round(randomBetween(rng, 5, 35)),
      lastPesticideDate,
      lastFertilizationDate,
      harvestToStorageDays,
    });
  }

  return bags;
}

function generateLocas(depotId: string, count: number, seed: number): Loca[] {
  const rng = seededRandom(seed);
  const locas: Loca[] = [];
  const availableVarieties = varieties.filter(v => v.useType !== 'seed');

  for (let i = 0; i < count; i++) {
    const locaId = `${depotId}-loca-${String(i + 1).padStart(2, '0')}`;
    const isEmpty = rng() < 0.1; // 10% empty
    const variety = isEmpty ? null : pickRandom(rng, availableVarieties);
    const capacityTon = Math.round(randomBetween(rng, 30, 60));
    const currentLoadTon = isEmpty ? 0 : Math.round(randomBetween(rng, capacityTon * 0.4, capacityTon * 0.9));
    const bigBagCount = isEmpty ? 0 : Math.round(currentLoadTon);
    const fireRisk = isEmpty ? 0 : Math.round(randomBetween(rng, 8, 55));

    let status: LocaStatus = 'optimal';
    if (fireRisk > 40) status = 'critical';
    else if (fireRisk > 25) status = 'warning';

    const residueProfile: ResidueProfile = {
      lastProducts: isEmpty ? [{ productType: 'potato' as ProductType, emptyDate: '2025-08-01' }] : [],
      ethyleneRemnant: parseFloat(randomBetween(rng, 0, 8).toFixed(1)),
      ammoniaRemnant: parseFloat(randomBetween(rng, 0, 3).toFixed(1)),
      cleaningDate: isEmpty ? '2025-08-15' : null,
    };

    const bigBags = generateBigBags(locaId, variety?.id || 'agria', bigBagCount, seed + i * 1000);

    locas.push({
      id: locaId,
      number: `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`,
      depotId,
      varietyId: variety?.id || null,
      productType: 'potato',
      capacityTon,
      currentLoadTon,
      bigBags,
      status,
      fireRiskScore: fireRisk,
      fillDate: isEmpty ? null : (() => {
        const daysAgo = Math.round(randomBetween(rng, 30, 150));
        return new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];
      })(),
      position: { row: Math.floor(i / 2), col: i % 2, side: i % 2 === 0 ? 'left' : 'right' },
      residueProfile,
    });
  }

  return locas;
}

export const depots: Depot[] = [
  {
    id: 'depot-bor',
    ownerId: 'owner-doga',
    name: 'Bor Deposu',
    city: 'Nigde',
    district: 'Bor',
    coordinates: [37.89, 34.56],
    capacityTon: 18000,
    hasChiller: true,
    hasDamperControl: true,
    locas: generateLocas('depot-bor', 14, hashSeed('depot-bor')),
  },
  {
    id: 'depot-derinkuyu',
    ownerId: 'owner-doga',
    name: 'Derinkuyu Deposu',
    city: 'Nevsehir',
    district: 'Derinkuyu',
    coordinates: [38.37, 34.73],
    capacityTon: 15000,
    hasChiller: true,
    hasDamperControl: true,
    locas: generateLocas('depot-derinkuyu', 12, hashSeed('depot-derinkuyu')),
  },
  {
    id: 'depot-eskil',
    ownerId: 'owner-doga',
    name: 'Eskil Deposu',
    city: 'Aksaray',
    district: 'Eskil',
    coordinates: [38.40, 33.42],
    capacityTon: 12000,
    hasChiller: false,
    hasDamperControl: true,
    locas: generateLocas('depot-eskil', 10, hashSeed('depot-eskil')),
  },
  {
    id: 'depot-doga1',
    ownerId: 'owner-doga',
    name: 'Doga-1 Deposu',
    city: 'Nigde',
    district: 'Merkez',
    coordinates: [37.97, 34.69],
    capacityTon: 14000,
    hasChiller: true,
    hasDamperControl: true,
    locas: generateLocas('depot-doga1', 16, hashSeed('depot-doga1')),
  },
  {
    id: 'depot-doga2',
    ownerId: 'owner-doga',
    name: 'Doga-2 Deposu',
    city: 'Nevsehir',
    district: 'Urgup',
    coordinates: [38.63, 34.91],
    capacityTon: 13140,
    hasChiller: false,
    hasDamperControl: true,
    locas: generateLocas('depot-doga2', 12, hashSeed('depot-doga2')),
  },
];
