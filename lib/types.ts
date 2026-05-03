export type PotatoUseType = 'seed' | 'table' | 'crisping' | 'french_fry' | 'baking';
export type LocaStatus = 'optimal' | 'warning' | 'critical';
export type DecisionAction = 'sell_now' | 'hold' | 'transfer';
export type ProductType = 'potato' | 'lemon' | 'apple' | 'onion' | 'legume' | 'cheese';
export type SensorAction = 'damper_open' | 'damper_close' | 'chiller_on' | 'chiller_off' | 'dehumidifier_on' | 'monitor_only' | 'alert';
export type AnomalyType = 'temp_high' | 'humidity_high' | 'co2_spike' | 'ammonia_spike';
export type DriftPhase = 'inactive' | 'ramping' | 'holding' | 'detected' | 'acting' | 'recovering' | 'resolved';

export interface PotatoVariety {
  id: string;
  name: string;
  origin: 'native' | 'imported' | 'doga_seed';
  useType: PotatoUseType;
  optimalTempC: [number, number];
  optimalHumidity: [number, number];
  optimalCo2ppm: [number, number];
  dormancyDays: number;
  sproutTriggerTempC: number;
  ammoniaThresholdPpm: number;
  ethyleneThresholdPpb: number;
  marketPriceTRY: number;
  pricesByMarket: Record<string, number>;
  notes: string;
  imageUrl?: string;
}

export interface Depot {
  id: string;
  ownerId: string;
  name: string;
  city: string;
  district: string;
  coordinates: [number, number];
  capacityTon: number;
  hasChiller: boolean;
  hasDamperControl: boolean;
  locas: Loca[];
}

export interface Loca {
  id: string;
  number: string;
  depotId: string;
  varietyId: string | null;
  productType: ProductType;
  capacityTon: number;
  currentLoadTon: number;
  bigBags: BigBag[];
  status: LocaStatus;
  fireRiskScore: number;
  fillDate: string | null;
  position: { row: number; col: number; side: 'left' | 'right' };
  residueProfile: ResidueProfile;
}

export interface ResidueProfile {
  lastProducts: Array<{ productType: ProductType; emptyDate: string }>;
  ethyleneRemnant: number;
  ammoniaRemnant: number;
  cleaningDate: string | null;
}

export interface BigBag {
  id: string;
  locaId: string;
  variety: string;
  weightKg: number;
  soilPercent: number;
  harvestDate: string;
  farmerId: string;
  contractId: string | null;
  positionInLoca: { row: number; col: number; tier: number };
  sensors: SensorReading;
  cvAnalysis: CVAnalysis;
  bruiseRiskScore: number;
  lastPesticideDate: string;       // ISO — last pesticide application
  lastFertilizationDate: string;   // ISO — last fertilization
  harvestToStorageDays: number;    // days between harvest and depot entry
}

export interface SensorReading {
  tempC: number;
  humidity: number;
  co2ppm: number;
  ammoniaPpm: number;
  ethylenePpb: number;
  thermalAvgC?: number;
  lastUpdate: string;
}

export interface CVAnalysis {
  potatoCount: number;
  sproutCount: number;
  bruiseCount: number;
  soilCoverage: number;
  averageSizeMm: number;
  sizeDistribution: { seed: number; table: number; baking: number };
  imageUrl: string;
  thermalImageUrl: string;
  analysisTime: string;
}

export interface Farmer {
  id: string;
  name: string;
  farmName: string;
  city: string;
  coordinates: [number, number];
  totalAreaHectare: number;
  varieties: string[];
  contractIds: string[];
}

export interface Contract {
  id: string;
  farmerId: string;
  buyerId: string;
  varietyId: string;
  plantingDate: string;
  estimatedHarvestDate: string;
  estimatedYieldTon: number;
  pricePerKg: number;
  paymentCurrency: 'TRY' | 'EUR' | 'USD';
  carbonReportUrl?: string;
}

export interface Buyer {
  id: string;
  name: string;
  type: 'processor' | 'wholesale_market' | 'export_broker';
  city: string;
  coordinates: [number, number];
  paymentCurrency: 'TRY' | 'EUR' | 'USD';
  acceptsVarieties: string[];
  pricePerKg: number;
  pricingHistory: Array<{ date: string; price: number }>;
}

export interface CarbonChain {
  segments: Array<{
    label: string;
    origin: { name: string; coords: [number, number] };
    destination: { name: string; coords: [number, number] };
    distanceKm: number;
    weightTon: number;
    soilWasteTon?: number;
    mode: 'truck' | 'rail' | 'sea' | 'air';
    emissionFactor: number;
    co2kg: number;
  }>;
  totalCO2kg: number;
  cbamCostEUR: number;
  cbamCostTRY: number;
  fxRate: { pair: string; rate: number; updatedAt: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routeGeoJSON: any;
}

export interface SellDecision {
  locaId: string;
  variety: string;
  weightTon: number;
  fireRiskScore: number;
  recommendation: DecisionAction;
  scenarios: Array<{
    label: string;
    days: number;
    estimatedPriceTRY: number;
    estimatedPriceEUR?: number;
    fireIncreasePct: number;
    fxImpactPct: number;
    netRevenueTRY: number;
    netRevenueEUR?: number;
    deltaVsNow: number;
  }>;
  carbonChain: CarbonChain;
  aiReasoning: string[];
  buyerName: string;
}

export interface VentilationDecision {
  locaId: string;
  trigger: 'temp_high' | 'co2_high' | 'humidity_high' | 'manual';
  internalConditions: SensorReading;
  externalConditions: { tempC: number; humidity: number; precipitation: boolean; windKmh: number };
  decision: SensorAction;
  reasoning: string;
  estimatedDurationMin: number;
  phase?: DriftPhase;
  actionLabel?: string;
  actionIcon?: string;
  anomalyType?: AnomalyType;
  indicators?: {
    intEnthalpy: number;
    extEnthalpy: number;
    enthalpyDelta: number;
    tempDelta: number;
    absHumDelta: number;
    intAbsHum: number;
    extAbsHum: number;
  };
  classicDecision?: string;
}

export interface ActionEntry {
  id: string;
  timestamp: string;
  type: 'ventilation' | 'anomaly' | 'recovery' | 'system' | 'detection';
  locaId: string;
  locaNumber: string;
  description: string;
  anomalyType?: AnomalyType;
}

export interface ProductCompatibility {
  fromProduct: ProductType;
  toProduct: ProductType;
  compatible: 'yes' | 'caution' | 'no';
  reason: string;
  alternativeAction?: string;
}
