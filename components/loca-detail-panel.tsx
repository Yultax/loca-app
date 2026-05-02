'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Warehouse, Weight, Package, Clock, TrendingUp, MapPin, Wind, Droplets, Thermometer, Snowflake, Fan, AlertTriangle } from 'lucide-react';
import type { VentilationDecision } from '@/lib/types';
import { useSelectedLoca, useLocaRisk, useSelectedDepot } from '@/hooks/use-loca-state';
import { useSensorRealtime } from '@/hooks/use-sensor-realtime';
import { useTobbPrice } from '@/hooks/use-tobb-price';
import { useDepotWeather } from '@/hooks/use-depot-weather';
import { SensorCharts } from './sensor-charts';
import { ProductCompatibilityChecker } from './product-compatibility-checker';
import { varieties } from '@/lib/seed/varieties';
import { USE_TYPE_LABELS } from '@/lib/constants';

function daysInStorage(fillDate: string | null): number {
  if (!fillDate) return 0;
  return Math.floor((Date.now() - new Date(fillDate).getTime()) / (1000 * 60 * 60 * 24));
}

const CARD_SHADOW = 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)';

function weatherEmoji(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('açık')) return '☀️';
  if (d.includes('bulut') || d.includes('parça')) return '⛅';
  if (d.includes('sis')) return '🌫️';
  if (d.includes('yağmur') || d.includes('sağanak') || d.includes('çisenti')) return '🌧️';
  if (d.includes('kar')) return '❄️';
  if (d.includes('fırtına') || d.includes('gök')) return '⛈️';
  return '🌤️';
}

function tempColor(t: number): string {
  if (t < 5) return 'text-blue-400';
  if (t <= 15) return 'text-[hsl(var(--success))]';
  return 'text-[hsl(var(--peri-orange))]';
}

const ACTION_ICON_MAP: Record<string, typeof Snowflake> = {
  '❄️': Snowflake,
  '🌀': Fan,
  '⚠️': AlertTriangle,
  '🌡️': Thermometer,
};

const PHASE_PROGRESS: Record<string, { pct: number; label: string }> = {
  detected: { pct: 25, label: 'Algılandı' },
  acting: { pct: 50, label: 'Müdahale' },
  recovering: { pct: 75, label: 'İyileşme' },
  resolved: { pct: 100, label: 'Çözüldü' },
};

interface LocaDetailPanelProps {
  anomalyStartTime?: string | null;
  detectedTimestamp?: string | null;
  ventilationDecision?: VentilationDecision | null;
  showVentilation?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LocaDetailPanel({ anomalyStartTime, detectedTimestamp, ventilationDecision, showVentilation }: LocaDetailPanelProps) {
  const loca = useSelectedLoca();
  const depot = useSelectedDepot();
  const riskOverride = useLocaRisk(loca?.id ?? '');
  const { history, isLoading } = useSensorRealtime(loca?.id ?? null);
  const { price: tobbPrice } = useTobbPrice();
  const depotWeather = useDepotWeather(depot?.coordinates ?? null);
  const [compatOpen, setCompatOpen] = useState(false);

  const variety = loca?.varietyId ? varieties.find(v => v.id === loca.varietyId) ?? null : null;

  const borsaPriceTRY = tobbPrice?.ortalama ?? variety?.marketPriceTRY ?? 0;

  if (!loca) {
    return (
      <Card
        className="p-8 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))] flex flex-col items-center justify-center min-h-[300px]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="text-[hsl(var(--muted))] text-center space-y-3">
          <Warehouse className="w-12 h-12 mx-auto opacity-20 animate-pulse" />
          <p className="text-base font-semibold">Detay gorunumu icin bir loca secin</p>
          <p className="text-xs opacity-60">Sol panelden bir loca tiklayin</p>
        </div>
      </Card>
    );
  }

  // Empty loca → show compatibility checker
  if (!loca.varietyId) {
    return (
      <>
        <Card
          className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">
                  {loca.number} — <span className="italic font-normal">Bos Loca</span>
                </h3>
                {depot && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[hsl(var(--earth-brown))]/30 text-[hsl(var(--muted))]">
                    {depot.name.replace(' Deposu', '')}
                  </span>
                )}
              </div>
              <span className="text-xs text-[hsl(var(--muted))]">Kapasite: {loca.capacityTon} ton</span>
            </div>
            <button
              onClick={() => setCompatOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[hsl(var(--peri-orange))]/20 text-[hsl(var(--peri-orange))] text-sm font-semibold hover:bg-[hsl(var(--peri-orange))]/30 transition-colors"
            >
              + Urun Ata
            </button>
          </div>
          <Separator className="bg-[hsl(var(--border))] mb-3" />
          <div className="grid grid-cols-3 gap-3 text-sm font-mono">
            <div>
              <div className="text-xs text-[hsl(var(--muted))]">Etilen</div>
              <div>{loca.residueProfile.ethyleneRemnant} ppb</div>
            </div>
            <div>
              <div className="text-xs text-[hsl(var(--muted))]">Amonyak</div>
              <div>{loca.residueProfile.ammoniaRemnant} ppm</div>
            </div>
            <div>
              <div className="text-xs text-[hsl(var(--muted))]">Temizlik</div>
              <div>{loca.residueProfile.cleaningDate ?? '—'}</div>
            </div>
          </div>
        </Card>
        <ProductCompatibilityChecker
          loca={loca}
          open={compatOpen}
          onOpenChange={setCompatOpen}
        />
      </>
    );
  }

  const effectiveRisk = riskOverride?.fireRiskScore ?? loca.fireRiskScore;
  const effectiveStatus = riskOverride?.status ?? loca.status;
  const days = daysInStorage(loca.fillDate);
  const loadPct = loca.capacityTon > 0 ? Math.round((loca.currentLoadTon / loca.capacityTon) * 100) : 0;

  const statusColor = {
    optimal: 'text-[hsl(var(--success))]',
    warning: 'text-[hsl(var(--warning))]',
    critical: 'text-[hsl(var(--danger))]',
  }[effectiveStatus];

  const statusBg = {
    optimal: 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]',
    warning: 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]',
    critical: 'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]',
  }[effectiveStatus];

  const statusLabel = {
    optimal: 'OPTIMAL',
    warning: 'UYARI',
    critical: 'KRITIK',
  }[effectiveStatus];

  return (
    <>
      {/* Header Card */}
      <Card
        className="p-4 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {/* Location line + weather */}
        {depot && (
          <div className="flex items-center justify-between gap-2 mb-2 px-2.5 py-1.5 rounded-lg bg-[hsl(var(--cave-bg))]/60">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-[hsl(var(--peri-orange))] shrink-0" />
              <span className="text-sm font-semibold text-[hsl(var(--cream))]">
                {depot.city}/{depot.district}
              </span>
              <span className="text-xs text-[hsl(var(--muted))]">— {depot.name}</span>
            </div>
            {!depotWeather.isLoading && (
              <div className="flex items-center gap-2.5 text-xs font-mono shrink-0">
                <span>{weatherEmoji(depotWeather.description)}</span>
                <span className={tempColor(depotWeather.tempC)}>{depotWeather.tempC.toFixed(0)}°C</span>
                <span className="flex items-center gap-0.5 text-[hsl(var(--muted))]">
                  <Droplets className="w-3 h-3" />{depotWeather.humidity}%
                </span>
                <span className="flex items-center gap-0.5 text-[hsl(var(--muted))]">
                  <Wind className="w-3 h-3" />{depotWeather.windKmh} km/h
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${depotWeather.source === 'live' ? 'bg-[hsl(var(--success))]' : depotWeather.source === 'cache' ? 'bg-yellow-400' : 'bg-[hsl(var(--muted))]'}`}
                  title={`Kaynak: ${depotWeather.source}`}
                />
              </div>
            )}
          </div>
        )}

        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-xl leading-tight whitespace-nowrap">
              {loca.number} — {variety?.name ?? 'Bos'}
            </h3>
            {variety && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[hsl(var(--peri-orange))]/15 text-[hsl(var(--peri-orange))] shrink-0">
                {USE_TYPE_LABELS[variety.useType] ?? variety.useType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${statusBg}`}>
              {statusLabel}
            </span>
            <div className={`text-4xl font-mono font-black leading-none ${statusColor}`}>
              %{effectiveRisk}
            </div>
          </div>
        </div>

        <Separator className="bg-[hsl(var(--border))] mb-2" />

        {/* Stats — 3 columns */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {/* Yuk */}
          <div className="flex items-center gap-2.5 rounded-lg bg-[hsl(var(--cave-bg))]/60 px-2.5 py-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--peri-orange))]/15 flex items-center justify-center shrink-0">
              <Weight className="w-4 h-4 text-[hsl(var(--peri-orange))]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-[hsl(var(--muted))] uppercase tracking-wider">Yuk</div>
              <div className="font-mono font-bold text-sm leading-tight">
                {loca.currentLoadTon}<span className="text-[hsl(var(--muted))] font-normal text-xs">/{loca.capacityTon}t</span>
              </div>
              <div className="w-full h-1 rounded-full bg-[hsl(var(--cave-bg))] mt-1">
                <div
                  className="h-1 rounded-full bg-[hsl(var(--peri-orange))] transition-all"
                  style={{ width: `${Math.min(loadPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Big-Bag */}
          <div className="flex items-center gap-2.5 rounded-lg bg-[hsl(var(--cave-bg))]/60 px-2.5 py-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success))]/15 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-[hsl(var(--success))]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[hsl(var(--muted))] uppercase tracking-wider">Big-Bag</div>
              <div className="font-mono font-bold text-sm leading-tight">
                {loca.bigBags.length} <span className="text-[hsl(var(--muted))] font-normal text-xs">adet</span>
              </div>
            </div>
          </div>

          {/* Depoda */}
          <div className="flex items-center gap-2.5 rounded-lg bg-[hsl(var(--cave-bg))]/60 px-2.5 py-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--cream))]/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[hsl(var(--cream))]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[hsl(var(--muted))] uppercase tracking-wider">Depoda</div>
              <div className="font-mono font-bold text-sm leading-tight">
                {days} <span className="text-[hsl(var(--muted))] font-normal text-xs">gun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Borsa Price — compact, TL only */}
        <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--cave-bg))]/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--peri-orange))]" />
            <span className="text-[10px] text-[hsl(var(--muted))] uppercase tracking-wider">Borsa Fiyati</span>
            {tobbPrice?.source === 'live' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            )}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono font-black text-lg text-[hsl(var(--peri-orange))] leading-none">
              {borsaPriceTRY.toFixed(2)} <span className="text-xs font-semibold">TL/kg</span>
            </span>
            {tobbPrice && tobbPrice.enAz > 0 && (
              <span className="text-[10px] text-[hsl(var(--muted))] font-mono">
                {tobbPrice.enAz.toFixed(2)}–{tobbPrice.enCok.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Ventilation Notification Bar */}
      {showVentilation && ventilationDecision && (() => {
        const phase = ventilationDecision.phase ?? 'detected';
        const prog = PHASE_PROGRESS[phase] ?? { pct: 25, label: phase };
        const IconComp = ACTION_ICON_MAP[ventilationDecision.actionIcon ?? ''] ?? Fan;
        const intC = ventilationDecision.internalConditions;
        const extC = ventilationDecision.externalConditions;
        return (
          <div
            className="ventilation-panel-enter flex items-center gap-3 rounded-xl px-4 py-2.5 border border-[hsl(var(--danger))]/40"
            style={{
              background: 'linear-gradient(135deg, hsl(0 50% 15% / 0.6), hsl(28 19% 13% / 0.8))',
              boxShadow: '0 0 20px hsl(0 60% 30% / 0.25), inset 0 0 12px rgba(0,0,0,0.3)',
            }}
          >
            {/* Action icon + label */}
            <div className="flex items-center gap-2 shrink-0">
              <IconComp className="w-5 h-5 text-red-400" />
              <span className="text-sm font-bold text-red-300 uppercase tracking-wide whitespace-nowrap">
                {ventilationDecision.actionLabel ?? ventilationDecision.decision}
              </span>
            </div>

            <div className="w-px h-6 bg-[hsl(var(--border))]" />

            {/* Internal / External readings */}
            <div className="flex items-center gap-3 font-mono text-xs shrink-0">
              <span className="text-[hsl(var(--cream))]">
                İç: <span className="font-bold">{intC.tempC.toFixed(1)}°C</span> %{intC.humidity.toFixed(0)}
              </span>
              <span className="text-[hsl(var(--muted))]">
                Dış: <span className="font-bold">{extC.tempC.toFixed(1)}°C</span> %{extC.humidity.toFixed(0)}
              </span>
            </div>

            {/* Progress bar + phase */}
            <div className="flex-1 min-w-0 flex items-center gap-2 ml-auto">
              <div className="flex-1 h-2 rounded-full bg-[hsl(var(--cave-bg))] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-700"
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-[hsl(var(--muted))] uppercase tracking-wider whitespace-nowrap">
                {prog.label}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Sensor Charts */}
      <Card
        className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <SensorCharts
          history={history}
          variety={variety}
          isLoading={isLoading}
        />
      </Card>

    </>
  );
}
