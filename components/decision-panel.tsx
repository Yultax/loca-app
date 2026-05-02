'use client';

import { useDecisionState } from '@/hooks/use-decision-state';
import { useSelectedLoca } from '@/hooks/use-loca-state';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, TrendingUp, TrendingDown, Truck, FileDown } from 'lucide-react';
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

export function DecisionPanel({ onSell }: { onSell?: () => void }) {
  const loca = useSelectedLoca();
  const { decision, isLoading, error } = useDecisionState();
  const [sold, setSold] = useState(false);

  if (!loca || !loca.varietyId) return null;

  if (isLoading) {
    return (
      <Card
        className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
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
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !decision) {
    return (
      <Card
        className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[hsl(var(--danger))]" />
          <h3 className="font-bold">Karar Motoru</h3>
        </div>
        <p className="text-sm text-[hsl(var(--danger))] mt-2">
          Karar verisi alinamadi. Yeniden deneyin.
        </p>
      </Card>
    );
  }

  const handleSell = () => {
    setSold(true);
    onSell?.();
  };

  return (
    <Card
      className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
      style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-[hsl(var(--peri-orange))]" />
        <h3 className="font-bold">Karar Motoru</h3>
        <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full bg-[hsl(var(--peri-orange))]/20 text-[hsl(var(--peri-orange))]">
          {decision.recommendation === 'sell_now' ? 'SIMDI SAT' : 'BEKLE'}
        </span>
      </div>

      {/* AI Reasoning */}
      <ul className="space-y-1.5 mb-4 text-sm">
        {decision.aiReasoning.map((r, i) => (
          <li key={i} className="text-[hsl(var(--cream))]/80 leading-snug">
            <span className="text-[hsl(var(--peri-orange))] mr-1.5">•</span>
            {r}
          </li>
        ))}
      </ul>

      {/* Scenario cards */}
      <div className="grid grid-cols-3 gap-3">
        {decision.scenarios.map((s) => {
          const isRecommended =
            (decision.recommendation === 'sell_now' && s.days === 0) ||
            (decision.recommendation === 'hold' && s.days > 0 && s.netRevenueTRY === Math.max(...decision.scenarios.map(x => x.netRevenueTRY)));

          return (
            <div
              key={s.label}
              className={`p-4 rounded-xl border-2 ${
                isRecommended
                  ? 'border-[hsl(var(--peri-orange))] bg-[hsl(var(--peri-orange))]/10'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--cave-card))]'
              }`}
              style={{ boxShadow: 'inset 0 0 12px rgba(0,0,0,0.3)' }}
            >
              <div className="text-xs uppercase tracking-wider text-[hsl(var(--muted))]">
                {s.label}
              </div>
              <div className="text-2xl font-mono font-bold mt-2">
                {formatTRY(s.netRevenueTRY)}
              </div>
              {s.netRevenueEUR != null && (
                <div className="text-sm font-mono text-[hsl(var(--muted))]">
                  {formatEUR(s.netRevenueEUR)}
                </div>
              )}
              <div className="mt-2 text-xs font-mono text-[hsl(var(--warning))]">
                Fire +{s.fireIncreasePct.toFixed(1)}%
              </div>
              <div
                className={`mt-1 text-sm font-mono flex items-center gap-1 ${
                  s.deltaVsNow >= 0
                    ? 'text-[hsl(var(--success))]'
                    : 'text-[hsl(var(--danger))]'
                }`}
              >
                {s.deltaVsNow >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {s.deltaVsNow >= 0 ? '+' : ''}
                {s.deltaVsNow.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSell}
          disabled={sold}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
            sold
              ? 'bg-[hsl(var(--success))] text-white cursor-default'
              : 'bg-[hsl(var(--peri-orange))] hover:bg-[hsl(var(--peri-orange))]/80 text-white cursor-pointer'
          }`}
        >
          <Truck className="w-4 h-4" />
          {sold ? 'Sevkiyat Emri Verildi' : 'Sat ve Sevkiyat Yap'}
        </button>
        <button
          onClick={() => {
            const variety = varieties.find(v => v.name === decision.variety);
            const useTypeLabel = variety ? (USE_TYPE_LABELS[variety.useType] ?? variety.useType) : '';
            const recLabel = decision.recommendation === 'sell_now' ? 'SIMDI SAT' : 'BEKLE';
            const now = new Date();
            const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const locaNum = loca?.number ?? decision.locaId;
            const fileLocaNum = locaNum.replace(/[^A-Za-z0-9]/g, '');
            const fileDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

            // Sensor averages from bigBags
            const bags = loca?.bigBags ?? [];
            const bagCount = bags.length;
            const avgTemp = bagCount > 0 ? (bags.reduce((s, b) => s + b.sensors.tempC, 0) / bagCount).toFixed(1) : '-';
            const avgHum = bagCount > 0 ? (bags.reduce((s, b) => s + b.sensors.humidity, 0) / bagCount).toFixed(1) : '-';
            const avgCo2 = bagCount > 0 ? Math.round(bags.reduce((s, b) => s + b.sensors.co2ppm, 0) / bagCount) : '-';

            // Scenario table with fixed-width padding
            const pad = (str: string, len: number) => str.padEnd(len);
            const padL = (str: string, len: number) => str.padStart(len);
            const scenarioHeader = `${pad('Senaryo', 16)}| ${pad('Net Gelir (TRY)', 16)}| ${pad('Net Gelir (EUR)', 16)}| ${pad('Fire Artisi', 12)}| Degisim`;
            const scenarioDivider = '-'.repeat(scenarioHeader.length);
            const scenarioRows = decision.scenarios.map(s => {
              const tryStr = formatTRY(s.netRevenueTRY);
              const eurStr = s.netRevenueEUR != null ? formatEUR(s.netRevenueEUR) : '-';
              const fireStr = `+${s.fireIncreasePct.toFixed(1)}%`;
              const deltaStr = s.days === 0 ? 'Baz' : `${s.deltaVsNow >= 0 ? '+' : ''}${s.deltaVsNow.toFixed(2)}%`;
              return `${pad(s.label, 16)}| ${pad(tryStr, 16)}| ${pad(eurStr, 16)}| ${pad(fireStr, 12)}| ${deltaStr}`;
            });

            // Carbon chain segments
            const carbonRows = decision.carbonChain.segments.map(seg => {
              return `${pad(seg.label, 29)}| ${padL(seg.distanceKm.toFixed(1)+' km', 9)} | ${padL(seg.weightTon+'t', 5)} | ${seg.co2kg.toFixed(1)} kg`;
            });

            const report = [
              '=====================================',
              '        LOCA IZLENEBILIRLIK RAPORU',
              '=====================================',
              '',
              `Rapor Tarihi: ${dateStr}`,
              `Loca No: ${locaNum}`,
              '',
              '--- URUN BILGILERI ---',
              `Cesit: ${decision.variety}`,
              `Kullanim Tipi: ${useTypeLabel}`,
              `Toplam Agirlik: ${decision.weightTon} ton`,
              `Oneri: ${recLabel}`,
              '',
              '--- AI ANALIZ GEREKCELERI ---',
              ...decision.aiReasoning.map(r => `  * ${r}`),
              '',
              '--- SENARYO KARSILASTIRMASI ---',
              scenarioHeader,
              scenarioDivider,
              ...scenarioRows,
              '',
              '--- KARBON ZINCIRI ---',
              `${pad('Segment', 29)}| ${padL('Mesafe', 9)} | ${padL('Agrlk', 5)} | CO2`,
              '-'.repeat(65),
              ...carbonRows,
              '',
              `TOPLAM CO2: ${decision.carbonChain.totalCO2kg.toFixed(1)} kg`,
              `CBAM Maliyeti: ${decision.carbonChain.cbamCostEUR.toFixed(2)} EUR = ${formatTRY(decision.carbonChain.cbamCostTRY)}`,
              `Kur: ${decision.carbonChain.fxRate.pair} = ${decision.carbonChain.fxRate.rate.toFixed(2)}`,
              '',
              '--- SENSOR OZETI ---',
              `Ortalama Sicaklik: ${avgTemp} C`,
              `Ortalama Nem: %${avgHum}`,
              `Big-Bag Sayisi: ${bagCount}`,
              `Ortalama CO2: ${avgCo2} ppm`,
              '',
              '=====================================',
              'Bu rapor LOCA sistemi tarafindan',
              'otomatik olusturulmustur.',
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
          className="px-4 py-3 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--cream))] text-sm font-semibold hover:bg-[hsl(var(--cave-card))] transition-colors flex items-center gap-2"
        >
          <FileDown className="w-4 h-4" />
          Rapor
        </button>
      </div>
    </Card>
  );
}
