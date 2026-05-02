import { SensorReading, AnomalyType, DriftPhase } from './types';
import { varieties } from './seed/varieties';
import { depots } from './seed/depots';

export interface SimulatorState {
  readings: Map<string, SensorReading>;
}

export interface DriftConfig {
  locaId: string;
  anomalyType: AnomalyType;
  // Temperature
  targetTemp: number;
  originalTemp: number;
  recoveryTemp: number;
  // Humidity
  targetHumidity: number;
  originalHumidity: number;
  recoveryHumidity: number;
  // CO2
  targetCo2: number;
  originalCo2: number;
  // Ammonia
  targetAmmonia: number;
  originalAmmonia: number;
  // Timing (ms)
  startTime: number;
  rampEnd: number;        // +12s
  holdEnd: number;        // +32s (12+20)
  detectedTime: number;   // +37s (12+20+5)
  actionStartTime: number; // same as detectedTime
  actionEnd: number;      // +67s (37+30)
  endTime: number;        // +90s (67+23)
}

let state: SimulatorState | null = null;
const activeDrifts = new Map<string, DriftConfig>();

function initState(): SimulatorState {
  const readings = new Map<string, SensorReading>();

  for (const depot of depots) {
    for (const loca of depot.locas) {
      for (const bag of loca.bigBags) {
        readings.set(bag.id, { ...bag.sensors });
      }
    }
  }

  return { readings };
}

export function getState(): SimulatorState {
  if (!state) state = initState();
  return state;
}

export function injectDrift(
  locaId: string,
  anomalyType: AnomalyType,
  overrides?: Partial<{ targetTemp: number; targetHumidity: number; targetCo2: number; targetAmmonia: number }>
): DriftConfig {
  if (!state) state = initState();

  const readings = getReadingsForLoca(locaId);
  const n = readings.length || 1;
  const avgTemp = readings.reduce((s, r) => s + r.reading.tempC, 0) / n;
  const avgHum = readings.reduce((s, r) => s + r.reading.humidity, 0) / n;
  const avgCo2 = readings.reduce((s, r) => s + r.reading.co2ppm, 0) / n;
  const avgAmmonia = readings.reduce((s, r) => s + r.reading.ammoniaPpm, 0) / n;

  // Anomaly-type specific targets
  let targetTemp = avgTemp;
  let targetHumidity = avgHum;
  let targetCo2 = avgCo2;
  let targetAmmonia = avgAmmonia;

  // ALL anomaly types affect BOTH temp and humidity VERY aggressively
  switch (anomalyType) {
    case 'temp_high':
      targetTemp = overrides?.targetTemp ?? avgTemp + 7;
      targetHumidity = Math.min(99, avgHum + 10);
      break;
    case 'humidity_high':
      targetHumidity = overrides?.targetHumidity ?? Math.min(99, avgHum + 15);
      targetTemp = avgTemp + 4;
      break;
    case 'co2_spike':
      targetCo2 = overrides?.targetCo2 ?? avgCo2 + 2000;
      targetTemp = avgTemp + 4;
      targetHumidity = Math.min(99, avgHum + 8);
      break;
    case 'ammonia_spike':
      targetAmmonia = overrides?.targetAmmonia ?? avgAmmonia + 12;
      targetTemp = avgTemp + 3;
      targetHumidity = Math.min(99, avgHum + 7);
      break;
  }

  const now = Date.now();
  // Fast cycle: 20s total
  // 0-4s: ramp (values rise fast and visibly)
  // 4-6s: hold at peak (chart shows spike)
  // 6-7s: detected (system notices)
  // 7-13s: action (intervention active, values drop)
  // 13-20s: recovery (return to normal)
  const drift: DriftConfig = {
    locaId,
    anomalyType,
    targetTemp,
    originalTemp: avgTemp,
    recoveryTemp: avgTemp,
    targetHumidity,
    originalHumidity: avgHum,
    recoveryHumidity: avgHum,
    targetCo2,
    originalCo2: avgCo2,
    targetAmmonia,
    originalAmmonia: avgAmmonia,
    startTime: now,
    rampEnd: now + 4000,
    holdEnd: now + 6000,
    detectedTime: now + 7000,
    actionStartTime: now + 7000,
    actionEnd: now + 13000,
    endTime: now + 20000,
  };

  activeDrifts.set(locaId, drift);
  return drift;
}

export function getActiveDrift(locaId: string): DriftConfig | undefined {
  return activeDrifts.get(locaId);
}

export function getDriftPhase(locaId: string): DriftPhase {
  const drift = activeDrifts.get(locaId);
  if (!drift) return 'inactive';
  const now = Date.now();

  if (now > drift.endTime) {
    activeDrifts.delete(locaId);
    return 'resolved';
  }
  if (now < drift.rampEnd) return 'ramping';
  if (now < drift.holdEnd) return 'holding';
  if (now < drift.detectedTime) return 'detected';
  if (now < drift.actionEnd) return 'acting';
  return 'recovering';
}

export function isDriftActive(locaId: string): boolean {
  const drift = activeDrifts.get(locaId);
  if (!drift) return false;
  if (Date.now() > drift.endTime) {
    activeDrifts.delete(locaId);
    return false;
  }
  return true;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function getDriftValues(drift: DriftConfig): { temp: number; humidity: number; co2: number; ammonia: number } {
  const now = Date.now();
  const { originalTemp, targetTemp, recoveryTemp, originalHumidity, targetHumidity, recoveryHumidity, originalCo2, targetCo2, originalAmmonia, targetAmmonia } = drift;

  if (now >= drift.endTime) {
    return { temp: recoveryTemp, humidity: recoveryHumidity, co2: originalCo2, ammonia: originalAmmonia };
  }

  // Phase 1: Ramp (0 → rampEnd)
  if (now < drift.rampEnd) {
    const t = easeInOut((now - drift.startTime) / (drift.rampEnd - drift.startTime));
    return {
      temp: originalTemp + (targetTemp - originalTemp) * t,
      humidity: originalHumidity + (targetHumidity - originalHumidity) * t,
      co2: originalCo2 + (targetCo2 - originalCo2) * t,
      ammonia: originalAmmonia + (targetAmmonia - originalAmmonia) * t,
    };
  }

  // Phase 2: Hold (rampEnd → holdEnd) — micro oscillation around target
  if (now < drift.holdEnd) {
    const osc = (Math.random() - 0.5) * 0.3;
    return {
      temp: targetTemp + osc,
      humidity: targetHumidity + (Math.random() - 0.5) * 0.5,
      co2: targetCo2 + (Math.random() - 0.5) * 20,
      ammonia: targetAmmonia + (Math.random() - 0.5) * 0.2,
    };
  }

  // Phase 3: Detected (holdEnd → detectedTime) — still at target, system just noticed
  if (now < drift.detectedTime) {
    return {
      temp: targetTemp + (Math.random() - 0.5) * 0.2,
      humidity: targetHumidity + (Math.random() - 0.5) * 0.3,
      co2: targetCo2 + (Math.random() - 0.5) * 15,
      ammonia: targetAmmonia + (Math.random() - 0.5) * 0.15,
    };
  }

  // Phase 4: Action (detectedTime → actionEnd) — gradual descent, 60-70% recovery
  if (now < drift.actionEnd) {
    const t = easeInOut((now - drift.actionStartTime) / (drift.actionEnd - drift.actionStartTime));
    const actionRecoveryFactor = 0.65;
    return {
      temp: targetTemp + (recoveryTemp - targetTemp) * actionRecoveryFactor * t,
      humidity: targetHumidity + (recoveryHumidity - targetHumidity) * actionRecoveryFactor * t,
      co2: targetCo2 + (originalCo2 - targetCo2) * actionRecoveryFactor * t,
      ammonia: targetAmmonia + (originalAmmonia - targetAmmonia) * actionRecoveryFactor * t,
    };
  }

  // Phase 5: Recovery (actionEnd → endTime) — finish remaining 30-40%
  const t = easeInOut((now - drift.actionEnd) / (drift.endTime - drift.actionEnd));
  const actionRecoveryFactor = 0.65;
  const tempAfterAction = targetTemp + (recoveryTemp - targetTemp) * actionRecoveryFactor;
  const humAfterAction = targetHumidity + (recoveryHumidity - targetHumidity) * actionRecoveryFactor;
  const co2AfterAction = targetCo2 + (originalCo2 - targetCo2) * actionRecoveryFactor;
  const ammoniaAfterAction = targetAmmonia + (originalAmmonia - targetAmmonia) * actionRecoveryFactor;

  return {
    temp: tempAfterAction + (recoveryTemp - tempAfterAction) * t,
    humidity: humAfterAction + (recoveryHumidity - humAfterAction) * t,
    co2: co2AfterAction + (originalCo2 - co2AfterAction) * t,
    ammonia: ammoniaAfterAction + (originalAmmonia - ammoniaAfterAction) * t,
  };
}

export function tick(): Array<{ bigBagId: string; locaId: string; reading: SensorReading }> {
  if (!state) state = initState();
  const updates: Array<{ bigBagId: string; locaId: string; reading: SensorReading }> = [];

  for (const depot of depots) {
    for (const loca of depot.locas) {
      if (!loca.varietyId || loca.bigBags.length === 0) continue;

      const variety = varieties.find(v => v.id === loca.varietyId);
      if (!variety) continue;

      const drift = activeDrifts.get(loca.id);
      const hasDrift = drift && Date.now() <= drift.endTime;

      for (const bag of loca.bigBags) {
        const prev = state.readings.get(bag.id);
        if (!prev) continue;

        let newTemp: number;
        let newHumidity: number;
        let newCo2: number;
        let newAmmonia: number;

        if (hasDrift) {
          const dv = getDriftValues(drift);
          newTemp = dv.temp + (Math.random() - 0.5) * 0.4;
          newHumidity = dv.humidity + (Math.random() - 0.5) * 0.6;
          newCo2 = dv.co2 + (Math.random() - 0.5) * 30;
          newAmmonia = dv.ammonia + (Math.random() - 0.5) * 0.15;
        } else {
          newTemp = prev.tempC + (Math.random() - 0.48) * 0.15;
          newHumidity = prev.humidity + (Math.random() - 0.5) * 0.5;
          newCo2 = prev.co2ppm + (Math.random() - 0.3) * 30;
          newAmmonia = prev.ammoniaPpm + (Math.random() - 0.45) * 0.2;
        }

        const ethyleneDrift = (Math.random() - 0.4) * 0.5;

        const newReading: SensorReading = {
          tempC: parseFloat(newTemp.toFixed(2)),
          humidity: parseFloat(Math.min(99, Math.max(60, newHumidity)).toFixed(1)),
          co2ppm: Math.round(Math.max(400, newCo2)),
          ammoniaPpm: parseFloat(Math.max(0, newAmmonia).toFixed(2)),
          ethylenePpb: parseFloat(Math.max(0, prev.ethylenePpb + ethyleneDrift).toFixed(1)),
          lastUpdate: new Date().toISOString(),
        };

        state.readings.set(bag.id, newReading);
        updates.push({ bigBagId: bag.id, locaId: loca.id, reading: newReading });
      }
    }
  }

  return updates;
}

export function getReadingsForLoca(locaId: string): Array<{ bigBagId: string; reading: SensorReading }> {
  if (!state) state = initState();
  const results: Array<{ bigBagId: string; reading: SensorReading }> = [];

  for (const depot of depots) {
    for (const loca of depot.locas) {
      if (loca.id !== locaId) continue;
      for (const bag of loca.bigBags) {
        const reading = state.readings.get(bag.id);
        if (reading) results.push({ bigBagId: bag.id, reading });
      }
    }
  }

  return results;
}
