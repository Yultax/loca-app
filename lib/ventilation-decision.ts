import type { SensorReading, PotatoVariety, VentilationDecision, SensorAction, AnomalyType } from './types';

export interface WeatherReading {
  tempC: number;
  humidity: number;
  precipitation: boolean;
  windKmh: number;
}

interface VentDecisionInput {
  locaId: string;
  locaNumber: string;
  internal: SensorReading;
  external: WeatherReading;
  variety: PotatoVariety;
  hasChiller: boolean;
  anomalyType?: AnomalyType;
}

// Absolute humidity (g water vapor / kg dry air) — Magnus formula
export function absoluteHumidity(tempC: number, relHum: number): number {
  const Es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  const E = (relHum / 100) * Es;
  return 622 * E / (1013.25 - E);
}

// Enthalpy (kJ/kg dry air)
export function enthalpy(tempC: number, relHum: number): number {
  const W = absoluteHumidity(tempC, relHum) / 1000;
  return 1.006 * tempC + W * (2501 + 1.86 * tempC);
}

export function decideVentilation(input: VentDecisionInput): VentilationDecision {
  const { locaId, internal, external, hasChiller, anomalyType } = input;

  const intEnthalpy = enthalpy(internal.tempC, internal.humidity);
  const extEnthalpy = enthalpy(external.tempC, external.humidity);
  const enthalpyDelta = intEnthalpy - extEnthalpy;

  const intAbsHum = absoluteHumidity(internal.tempC, internal.humidity);
  const extAbsHum = absoluteHumidity(external.tempC, external.humidity);

  const indicators = {
    intEnthalpy: parseFloat(intEnthalpy.toFixed(1)),
    extEnthalpy: parseFloat(extEnthalpy.toFixed(1)),
    enthalpyDelta: parseFloat(enthalpyDelta.toFixed(1)),
    tempDelta: parseFloat((internal.tempC - external.tempC).toFixed(1)),
    absHumDelta: parseFloat((intAbsHum - extAbsHum).toFixed(1)),
    intAbsHum: parseFloat(intAbsHum.toFixed(1)),
    extAbsHum: parseFloat(extAbsHum.toFixed(1)),
  };

  const classicDecision = external.tempC > internal.tempC
    ? 'kapat (dışarı sıcak)'
    : external.tempC < internal.tempC - 2
      ? 'aç (dışarı soğuk)'
      : 'kapat (fark yetersiz)';

  const base = {
    locaId,
    internalConditions: internal,
    externalConditions: external,
    indicators,
    classicDecision,
  };

  // If anomaly type specified, use type-specific matrix
  if (anomalyType) {
    const result = decideByAnomalyType(anomalyType, external, hasChiller, enthalpyDelta);
    return {
      ...base,
      trigger: result.trigger,
      decision: result.decision,
      reasoning: result.reasoning,
      estimatedDurationMin: result.estimatedDurationMin,
      actionLabel: result.actionLabel,
      actionIcon: result.actionIcon,
      anomalyType,
    };
  }

  // Fallback: generic enthalpy-based
  if (external.precipitation) {
    const decision: SensorAction = hasChiller ? 'chiller_on' : 'alert';
    return {
      ...base,
      trigger: 'humidity_high' as const,
      decision,
      reasoning: 'Dış ortamda yağış var, doğal havalandırma uygun değil.',
      estimatedDurationMin: hasChiller ? 30 : 0,
      actionLabel: hasChiller ? 'Mekanik Soğutma' : 'Manuel Kontrol',
      actionIcon: hasChiller ? 'snowflake' : 'alert-triangle',
    };
  }

  const benefit = enthalpyDelta > 1.5;
  if (benefit) {
    return {
      ...base,
      trigger: 'temp_high' as const,
      decision: 'damper_open',
      reasoning: `İç entalpi ${intEnthalpy.toFixed(1)} kJ/kg, dış entalpi ${extEnthalpy.toFixed(1)} kJ/kg. Fark ${enthalpyDelta.toFixed(1)} kJ/kg — dış hava içeriyi soğutur.`,
      estimatedDurationMin: 18,
      actionLabel: 'Kepenk Aç (Soğutma)',
      actionIcon: 'wind',
    };
  }

  if (hasChiller) {
    return {
      ...base,
      trigger: 'temp_high' as const,
      decision: 'chiller_on',
      reasoning: 'Doğal havalandırma faydasız, mekanik soğutma devrede.',
      estimatedDurationMin: 45,
      actionLabel: 'Mekanik Soğutma',
      actionIcon: 'snowflake',
    };
  }

  return {
    ...base,
    trigger: 'temp_high' as const,
    decision: 'alert',
    reasoning: 'Doğal havalandırma uygun değil, manuel müdahale gerekli.',
    estimatedDurationMin: 0,
    actionLabel: 'Manuel Kontrol Gerekli',
    actionIcon: 'alert-triangle',
  };
}

interface TypeDecisionResult {
  trigger: 'temp_high' | 'co2_high' | 'humidity_high' | 'manual';
  decision: SensorAction;
  reasoning: string;
  estimatedDurationMin: number;
  actionLabel: string;
  actionIcon: string;
}

function decideByAnomalyType(
  anomalyType: AnomalyType,
  external: WeatherReading,
  hasChiller: boolean,
  enthalpyDelta: number
): TypeDecisionResult {
  const extCold = external.tempC < 12;
  const extDry = external.humidity < 60;

  switch (anomalyType) {
    case 'temp_high':
      if (extCold && extDry && enthalpyDelta > 1.0) {
        return {
          trigger: 'temp_high',
          decision: 'damper_open',
          reasoning: `Dış hava soğuk ve kuru (${external.tempC}°C, %${external.humidity}). Entalpi farkı uygun — doğal soğutma.`,
          estimatedDurationMin: 20,
          actionLabel: 'Kepenk Aç (Soğutma)',
          actionIcon: 'wind',
        };
      }
      if (hasChiller) {
        return {
          trigger: 'temp_high',
          decision: 'chiller_on',
          reasoning: 'Dış hava uygun değil, mekanik soğutma devreye alındı.',
          estimatedDurationMin: 30,
          actionLabel: 'Mekanik Soğutma',
          actionIcon: 'snowflake',
        };
      }
      return {
        trigger: 'temp_high',
        decision: 'alert',
        reasoning: 'Dış hava uygun değil ve chiller yok. Acil müdahale gerekli.',
        estimatedDurationMin: 0,
        actionLabel: 'Acil Müdahale',
        actionIcon: 'alert-triangle',
      };

    case 'humidity_high':
      if (extDry && !external.precipitation) {
        return {
          trigger: 'humidity_high',
          decision: 'damper_open',
          reasoning: `Dış hava kuru (%${external.humidity}). Kepenk açılarak nem tahliyesi yapılıyor.`,
          estimatedDurationMin: 25,
          actionLabel: 'Kepenk Aç (Nem Tahliyesi)',
          actionIcon: 'wind',
        };
      }
      if (hasChiller) {
        return {
          trigger: 'humidity_high',
          decision: 'dehumidifier_on',
          reasoning: 'Dış hava nemli, nem alıcı devreye alındı.',
          estimatedDurationMin: 40,
          actionLabel: 'Nem Alıcı Aktif',
          actionIcon: 'droplets',
        };
      }
      return {
        trigger: 'humidity_high',
        decision: 'alert',
        reasoning: 'Dış hava nemli, mekanik nem alma yok. Manuel müdahale.',
        estimatedDurationMin: 0,
        actionLabel: 'Manuel Nem Kontrolü',
        actionIcon: 'alert-triangle',
      };

    case 'co2_spike':
      if (!external.precipitation) {
        return {
          trigger: 'co2_high',
          decision: 'damper_open',
          reasoning: 'CO₂ seviyesi kritik. Kepenk açılarak tahliye yapılıyor.',
          estimatedDurationMin: 15,
          actionLabel: 'Kepenk Aç (CO₂ Tahliyesi)',
          actionIcon: 'wind',
        };
      }
      return {
        trigger: 'co2_high',
        decision: 'alert',
        reasoning: 'CO₂ yüksek ama yağış var. Havalandırma mümkün değil — acil kontrol.',
        estimatedDurationMin: 0,
        actionLabel: 'Acil CO₂ Kontrolü',
        actionIcon: 'alert-triangle',
      };

    case 'ammonia_spike':
      if (!external.precipitation && external.windKmh > 3) {
        return {
          trigger: 'temp_high',
          decision: 'damper_open',
          reasoning: `Amonyak kritik seviyede. Rüzgar uygun (${external.windKmh} km/h) — havalandırma başlatıldı.`,
          estimatedDurationMin: 20,
          actionLabel: 'Havalandırma + Kontrol',
          actionIcon: 'wind',
        };
      }
      return {
        trigger: 'temp_high',
        decision: 'alert',
        reasoning: 'Amonyak kritik ancak dış koşullar uygun değil. Acil kontrol uyarısı.',
        estimatedDurationMin: 0,
        actionLabel: 'Acil Kontrol Uyarısı',
        actionIcon: 'alert-triangle',
      };
  }
}
