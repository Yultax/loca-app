'use client';

import { useDecisionState } from '@/hooks/use-decision-state';
import { useSelectedLoca } from '@/hooks/use-loca-state';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, TrendingUp, TrendingDown, Truck, FileDown,
  ChevronDown, ChevronUp, Calculator, Flame, Award,
} from 'lucide-react';
import { useState } from 'react';
import { USE_TYPE_LABELS } from '@/lib/constants';
import { varieties } from '@/lib/seed/varieties';

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatEUR(n: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function riskMultiplierLabel(risk: number): string {
  if (risk < 20) return '0.1 (düşük)';
  if (risk < 40) return '0.3 (orta)';
  if (risk < 60) return '0.5 (yüksek)';
  return '0.8 (kritik)';
}

function riskMultiplierValue(risk: number): number {
  if (risk < 20) return 0.1;
  if (risk < 40) return 0.3;
  if (risk < 60) return 0.5;
  return 0.8;
}

const CARD_SHADOW = 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)';

export function DecisionPanel({ onSell }: { onSell?: () => void }) {
  const loca = useSelectedLoca();
  const { decision, isLoading, error } = useDecisionState();
  const [sold, setSold] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);

  if (!loca || !loca.varietyId) return null;

  if (isLoading) {
    return (
      <Card
        className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-[hsl(var(--peri-orange))] animate-pulse" />
          <h3 className="font-bold">Karar Motoru</h3>
          <span className="text-xs text-[hsl(var(--muted))]">Analiz ediliyor...</span>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !decision) {
    return (
      <Card
        className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[hsl(var(--danger))]" />
          <h3 className="font-bold">Karar Motoru</h3>
        </div>
        <p className="text-sm text-[hsl(var(--danger))] mt-2">
          Karar verisi alınamadı. Yeniden deneyin.
        </p>
      </Card>
    );
  }

  const handleSell = () => {
    setSold(true);
    setSelectedScenario(0);
    setShowCalc(true);
    onSell?.();
  };

  const fireRisk = decision.fireRiskScore ?? loca.fireRiskScore;
  const rm = riskMultiplierValue(fireRisk);

  return (
    <Card
      className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))] overflow-hidden"
      style={{ boxShadow: CARD_SHADOW }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--peri-orange)), hsl(16 78% 48%))',
            boxShadow: '0 0 16px hsl(var(--peri-orange) / 0.3)',
          }}
        >
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight">Karar Motoru</h3>
          <div className="text-[10px] text-[hsl(var(--muted))] font-mono mt-0.5">
            {decision.variety} &middot; {decision.weightTon} ton &middot; {decision.buyerName ?? ''}
          </div>
        </div>
        <div
          className={`ml-auto px-3 py-1 rounded-full text-xs font-bold tracking-wider shrink-0 ${
            decision.recommendation === 'sell_now'
              ? 'bg-[hsl(var(--peri-orange))]/20 text-[hsl(var(--peri-orange))]'
              : 'bg-[hsl(var(--cave-blue))]/20 text-[hsl(var(--cave-blue))]'
          }`}
          style={{
            boxShadow: decision.recommendation === 'sell_now'
              ? '0 0 12px hsl(var(--peri-orange) / 0.2)'
              : '0 0 12px hsl(var(--cave-blue) / 0.2)',
          }}
        >
          {decision.recommendation === 'sell_now' ? 'ŞİMDİ SAT' : 'BEKLE'}
        </div>
      </div>

      {/* AI Reasoning — compact pills */}
      <div className="mb-4 space-y-1.5">
        {decision.aiReasoning.map((r, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-[13px] text-[hsl(var(--cream))]/85 leading-snug"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--peri-orange))] mt-[6px] shrink-0" />
            <span>{r}</span>
          </div>
        ))}
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {decision.scenarios.map((s) => {
          const isRecommended =
            (decision.recommendation === 'sell_now' && s.days === 0) ||
            (decision.recommendation === 'hold' && s.days > 0 && s.netRevenueTRY === Math.max(...decision.scenarios.map(x => x.netRevenueTRY)));
          const isSelected = selectedScenario === s.days;

          return (
            <button
              key={s.label}
              onClick={() => {
                setSelectedScenario(s.days);
                setShowCalc(true);
              }}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                isRecommended
                  ? 'border-[hsl(var(--peri-orange))]'
                  : isSelected
                    ? 'border-[hsl(var(--cream))]/30'
                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--cream))]/20'
              }`}
              style={{
                background: isRecommended
                  ? 'linear-gradient(160deg, hsl(16 78% 62% / 0.12), hsl(16 78% 62% / 0.04))'
                  : 'hsl(var(--cave-card))',
                boxShadow: isRecommended
                  ? 'inset 0 0 16px rgba(0,0,0,0.3), 0 0 20px hsl(16 78% 62% / 0.15)'
                  : 'inset 0 0 12px rgba(0,0,0,0.3)',
              }}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--peri-orange))] text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                  <Award className="w-2.5 h-2.5" />
                  Önerilen
                </div>
              )}

              {/* Label */}
              <div className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted))] font-semibold">
                {s.label}
              </div>

              {/* Net Revenue */}
              <div className="text-xl font-mono font-black mt-2 leading-tight">
                {formatTRY(s.netRevenueTRY)}
              </div>
              {s.netRevenueEUR != null && (
                <div className="text-xs font-mono text-[hsl(var(--muted))] mt-0.5">
                  {formatEUR(s.netRevenueEUR)}
                </div>
              )}

              {/* Fire + Delta row */}
              <div className="mt-3 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[11px] font-mono text-[hsl(var(--warning))]">
                  <Flame className="w-3 h-3" />
                  +{s.fireIncreasePct.toFixed(1)}%
                </div>
                <div
                  className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                    s.deltaVsNow >= 0
                      ? 'text-[hsl(var(--success))]'
                      : 'text-[hsl(var(--danger))]'
                  }`}
                >
                  {s.deltaVsNow >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {s.deltaVsNow >= 0 ? '+' : ''}
                  {s.deltaVsNow.toFixed(2)}%
                </div>
              </div>

              {/* Visual bar — fire progression */}
              <div className="mt-2 h-1 rounded-full bg-[hsl(var(--cave-bg))] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(s.fireIncreasePct * 3, 100)}%`,
                    background: s.fireIncreasePct < 3
                      ? 'hsl(var(--success))'
                      : s.fireIncreasePct < 8
                        ? 'hsl(var(--warning))'
                        : 'hsl(var(--danger))',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Calculation Breakdown — expandable */}
      <button
        onClick={() => setShowCalc(!showCalc)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[hsl(var(--cave-bg))]/60 text-sm font-semibold text-[hsl(var(--cream))]/80 hover:bg-[hsl(var(--cave-bg))] transition-colors mb-3"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[hsl(var(--peri-orange))]" />
          <span>Hesaplama Detayı</span>
        </div>
        {showCalc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showCalc && (() => {
        const sc = decision.scenarios.find(s => s.days === (selectedScenario ?? 0)) ?? decision.scenarios[0];
        const projectedFireTotal = fireRisk + sc.days * 0.4 + rm * sc.days;
        const netTon = decision.weightTon * (1 - (sc.fireIncreasePct + fireRisk) / 100);

        return (
          <div
            className="rounded-xl border border-[hsl(var(--border))] p-4 mb-3 space-y-3"
            style={{
              background: 'linear-gradient(160deg, hsl(28 19% 11%), hsl(28 19% 14%))',
              boxShadow: 'inset 0 0 16px rgba(0,0,0,0.4)',
            }}
          >
            {/* Which scenario */}
            <div className="flex items-center gap-2 text-xs font-mono text-[hsl(var(--muted))]">
              <span className="px-2 py-0.5 rounded bg-[hsl(var(--peri-orange))]/15 text-[hsl(var(--peri-orange))] font-bold">
                {sc.label}
              </span>
              <span>&middot; {sc.days} gün sonrası</span>
            </div>

            {/* Fire Formula */}
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--warning))] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Fire Hesaplaması
              </div>
              <div className="font-mono text-xs space-y-1 text-[hsl(var(--cream))]/80 pl-5">
                <div>
                  <span className="text-[hsl(var(--muted))]">Formül:</span>{' '}
                  Fire(t) = mevcut_risk + gün &times; 0.4 + çarpan &times; gün
                </div>
                <div>
                  <span className="text-[hsl(var(--muted))]">Değerler:</span>{' '}
                  Fire({sc.days}) = {fireRisk} + {sc.days} &times; 0.4 + {rm} &times; {sc.days}
                </div>
                <div>
                  <span className="text-[hsl(var(--muted))]">Sonuç:</span>{' '}
                  <span className="text-[hsl(var(--warning))] font-bold">
                    %{Math.min(projectedFireTotal, 100).toFixed(1)}
                  </span>
                  <span className="text-[hsl(var(--muted))]"> (artış: +{sc.fireIncreasePct.toFixed(1)}%)</span>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted))]">Risk çarpanı:</span>{' '}
                  {riskMultiplierLabel(fireRisk)}
                </div>
              </div>
            </div>

            {/* Net Revenue Formula */}
            <div className="space-y-1.5 pt-1 border-t border-[hsl(var(--border))]/50">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--success))] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Gelir Hesaplaması
              </div>
              <div className="font-mono text-xs space-y-1 text-[hsl(var(--cream))]/80 pl-5">
                <div>
                  <span className="text-[hsl(var(--muted))]">Brüt ağırlık:</span>{' '}
                  {decision.weightTon} ton
                </div>
                <div>
                  <span className="text-[hsl(var(--muted))]">Fire sonrası net:</span>{' '}
                  {netTon.toFixed(2)} ton
                </div>
                <div>
                  <span className="text-[hsl(var(--muted))]">Fiyat:</span>{' '}
                  {sc.estimatedPriceTRY.toFixed(2)} TL/kg
                  {sc.estimatedPriceEUR != null && ` (${sc.estimatedPriceEUR.toFixed(2)} €/kg)`}
                </div>
                <div>
                  <span className="text-[hsl(var(--muted))]">CBAM maliyeti:</span>{' '}
                  {decision.carbonChain.cbamCostEUR.toFixed(2)} € = {formatTRY(decision.carbonChain.cbamCostTRY)}
                </div>
                <div className="pt-1 border-t border-[hsl(var(--border))]/30">
                  <span className="text-[hsl(var(--muted))]">Net gelir:</span>{' '}
                  <span className="text-[hsl(var(--success))] font-bold">{formatTRY(sc.netRevenueTRY)}</span>
                  {sc.netRevenueEUR != null && (
                    <span className="text-[hsl(var(--muted))]"> ({formatEUR(sc.netRevenueEUR)})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CTA Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSell}
          disabled={sold}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            sold
              ? 'bg-[hsl(var(--success))] text-white cursor-default'
              : 'text-white cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
          }`}
          style={
            sold
              ? {}
              : {
                  background: 'linear-gradient(135deg, hsl(var(--peri-orange)), hsl(16 78% 48%))',
                  boxShadow: '0 4px 16px hsl(var(--peri-orange) / 0.3)',
                }
          }
        >
          <Truck className="w-4 h-4" />
          {sold ? 'Sevkiyat Emri Verildi' : 'Sat ve Sevkiyat Yap'}
        </button>
        <button
          onClick={() => {
            const variety = varieties.find(v => v.name === decision.variety);
            const useTypeLabel = variety ? (USE_TYPE_LABELS[variety.useType] ?? variety.useType) : '';
            const recLabel = decision.recommendation === 'sell_now' ? 'ŞİMDİ SAT' : 'BEKLE';
            const now = new Date();
            const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const locaNum = loca?.number ?? decision.locaId;
            const fileLocaNum = locaNum.replace(/[^A-Za-z0-9]/g, '');
            const fileDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

            const bags = loca?.bigBags ?? [];
            const bagCount = bags.length;
            const avgTemp = bagCount > 0 ? (bags.reduce((s, b) => s + b.sensors.tempC, 0) / bagCount).toFixed(1) : '-';
            const avgHum = bagCount > 0 ? (bags.reduce((s, b) => s + b.sensors.humidity, 0) / bagCount).toFixed(1) : '-';
            const avgCo2 = bagCount > 0 ? Math.round(bags.reduce((s, b) => s + b.sensors.co2ppm, 0) / bagCount) : '-';

            const pad = (str: string, len: number) => str.padEnd(len);
            const padL = (str: string, len: number) => str.padStart(len);
            const scenarioHeader = `${pad('Senaryo', 16)}| ${pad('Net Gelir (TRY)', 16)}| ${pad('Net Gelir (EUR)', 16)}| ${pad('Fire Artışı', 12)}| Değişim`;
            const scenarioDivider = '-'.repeat(scenarioHeader.length);
            const scenarioRows = decision.scenarios.map(s => {
              const tryStr = formatTRY(s.netRevenueTRY);
              const eurStr = s.netRevenueEUR != null ? formatEUR(s.netRevenueEUR) : '-';
              const fireStr = `+${s.fireIncreasePct.toFixed(1)}%`;
              const deltaStr = s.days === 0 ? 'Baz' : `${s.deltaVsNow >= 0 ? '+' : ''}${s.deltaVsNow.toFixed(2)}%`;
              return `${pad(s.label, 16)}| ${pad(tryStr, 16)}| ${pad(eurStr, 16)}| ${pad(fireStr, 12)}| ${deltaStr}`;
            });

            const carbonRows = decision.carbonChain.segments.map(seg => {
              return `${pad(seg.label, 29)}| ${padL(seg.distanceKm.toFixed(1)+' km', 9)} | ${padL(seg.weightTon+'t', 5)} | ${seg.co2kg.toFixed(1)} kg`;
            });

            const fRisk = decision.fireRiskScore ?? loca.fireRiskScore;
            const fRm = riskMultiplierValue(fRisk);

            const report = [
              '=====================================',
              '        LOCA İZLENEBİLİRLİK RAPORU',
              '=====================================',
              '',
              `Rapor Tarihi: ${dateStr}`,
              `Loca No: ${locaNum}`,
              '',
              '--- ÜRÜN BİLGİLERİ ---',
              `Çeşit: ${decision.variety}`,
              `Kullanım Tipi: ${useTypeLabel}`,
              `Toplam Ağırlık: ${decision.weightTon} ton`,
              `Öneri: ${recLabel}`,
              '',
              '--- AI ANALİZ GEREKÇELERİ ---',
              ...decision.aiReasoning.map(r => `  * ${r}`),
              '',
              '--- SENARYO KARŞILAŞTIRMASI ---',
              scenarioHeader,
              scenarioDivider,
              ...scenarioRows,
              '',
              '--- FİRE HESAPLAMA FORMÜLÜ ---',
              `Fire(t) = mevcut_risk + gün × 0.4 + çarpan × gün`,
              `Mevcut fire riski: %${fRisk}`,
              `Risk çarpanı: ${fRm} (${riskMultiplierLabel(fRisk)})`,
              ...decision.scenarios.map(s => {
                const proj = fRisk + s.days * 0.4 + fRm * s.days;
                return `  ${s.label}: Fire(${s.days}) = ${fRisk} + ${s.days}×0.4 + ${fRm}×${s.days} = %${Math.min(proj, 100).toFixed(1)}`;
              }),
              '',
              '--- KARBON ZİNCİRİ ---',
              `${pad('Segment', 29)}| ${padL('Mesafe', 9)} | ${padL('Ağrlk', 5)} | CO2`,
              '-'.repeat(65),
              ...carbonRows,
              '',
              `TOPLAM CO2: ${decision.carbonChain.totalCO2kg.toFixed(1)} kg`,
              `CBAM Maliyeti: ${decision.carbonChain.cbamCostEUR.toFixed(2)} EUR = ${formatTRY(decision.carbonChain.cbamCostTRY)}`,
              `Kur: ${decision.carbonChain.fxRate.pair} = ${decision.carbonChain.fxRate.rate.toFixed(2)}`,
              '',
              '--- SENSÖR ÖZETİ ---',
              `Ortalama Sıcaklık: ${avgTemp} °C`,
              `Ortalama Nem: %${avgHum}`,
              `Big-Bag Sayısı: ${bagCount}`,
              `Ortalama CO2: ${avgCo2} ppm`,
              '',
              '=====================================',
              'Bu rapor LOCA sistemi tarafından',
              'otomatik oluşturulmuştur.',
              '=====================================',
            ].join('\n');

            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LOCA-Rapor-${fileLocaNum}-${fileDate}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-3 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--cream))] text-sm font-semibold hover:bg-[hsl(var(--cave-bg))] transition-colors flex items-center gap-2"
        >
          <FileDown className="w-4 h-4" />
          Rapor
        </button>
      </div>
    </Card>
  );
}
