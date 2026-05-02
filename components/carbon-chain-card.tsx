'use client';

import { useDecisionState } from '@/hooks/use-decision-state';
import { useSelectedLoca } from '@/hooks/use-loca-state';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(n);
}

function SegmentRow({ segment: s }: { segment: { label: string; distanceKm: number; weightTon: number; co2kg: number } }) {
  return (
    <div>
      <div className="text-[hsl(var(--muted))]">{s.label}</div>
      <div className="text-xs text-[hsl(var(--cream))]">
        {s.distanceKm.toFixed(1)} km × {s.weightTon}t = <span className="font-semibold">{s.co2kg.toFixed(1)} kg CO₂</span>
      </div>
    </div>
  );
}

export function CarbonChainCard() {
  const loca = useSelectedLoca();
  const { decision, isLoading } = useDecisionState();

  if (!loca || !loca.varietyId) return null;

  if (isLoading) {
    return (
      <Card
        className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-[hsl(var(--peri-orange))]" />
          <h3 className="font-bold text-sm">Karbon Zinciri</h3>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Card>
    );
  }

  if (!decision) return null;

  const chain = decision.carbonChain;

  return (
    <Card
      className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
      style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-[hsl(var(--peri-orange))]" />
        <h3 className="font-bold text-sm">Karbon Zinciri</h3>
        <div className="ml-auto flex gap-1 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]">
            K1
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]">
            K2
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]">
            K3
          </span>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-2 font-mono text-sm">
        {chain.segments.map((s, i) => (
          <SegmentRow key={i} segment={s} />
        ))}

        <hr className="border-[hsl(var(--border))]" />

        {/* Total */}
        <div className="flex justify-between font-bold">
          <span>TOPLAM</span>
          <span>{chain.totalCO2kg.toFixed(1)} kg CO₂</span>
        </div>

        {/* CBAM */}
        <div className="flex justify-between text-[hsl(var(--peri-orange))]">
          <span>CBAM Maliyet</span>
          <span>
            {chain.cbamCostEUR.toFixed(2)} € = {formatTRY(chain.cbamCostTRY)}
          </span>
        </div>

        {/* FX */}
        <div className="flex justify-between text-xs text-[hsl(var(--muted))]">
          <span>{chain.fxRate.pair}</span>
          <span>{chain.fxRate.rate.toFixed(2)}</span>
        </div>
      </div>

    </Card>
  );
}
