'use client';

import { Warehouse } from 'lucide-react';
import type { Depot } from '@/lib/types';

interface DepotSummaryProps {
  depot: Depot;
}

export function DepotSummary({ depot }: DepotSummaryProps) {
  const totalLocas = depot.locas.length;
  const filledLocas = depot.locas.filter(l => l.varietyId !== null);
  const avgFireRisk = filledLocas.length > 0
    ? Math.round(filledLocas.reduce((s, l) => s + l.fireRiskScore, 0) / filledLocas.length)
    : 0;
  const criticalLoca = [...depot.locas]
    .filter(l => l.varietyId !== null)
    .sort((a, b) => b.fireRiskScore - a.fireRiskScore)[0];

  const totalLoad = depot.locas.reduce((s, l) => s + l.currentLoadTon, 0);

  const riskColor = avgFireRisk > 40
    ? 'text-[hsl(var(--danger))]'
    : avgFireRisk > 25
      ? 'text-[hsl(var(--warning))]'
      : 'text-[hsl(var(--success))]';

  return (
    <div
      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--cave-card))] px-3 py-2"
      style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Warehouse className="w-3.5 h-3.5 text-[hsl(var(--peri-orange))]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[hsl(var(--muted))]">{depot.city}/{depot.district}</span>
            <h3 className="font-bold text-xs">{depot.name.replace(' Deposu', '')}</h3>
            <span className={`px-1 py-0.5 rounded-full text-[9px] ${
              avgFireRisk > 40 ? 'bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]'
              : avgFireRisk > 25 ? 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]'
              : 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'
            }`}>
              Fire %{avgFireRisk}
            </span>
            <span className="px-1 py-0.5 rounded-full bg-[hsl(var(--cave-blue))]/20 text-[hsl(var(--cave-blue))] text-[9px]">
              %{Math.round((filledLocas.length / totalLocas) * 100)} dolu
            </span>
            <span className="text-[9px] text-[hsl(var(--muted))] ml-auto">{depot.capacityTon.toLocaleString('tr-TR')}t</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-[hsl(var(--muted))]">Loca</span>
          <span className="font-mono font-semibold text-xs">{filledLocas.length}/{totalLocas}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-[hsl(var(--muted))]">Yuk</span>
          <span className="font-mono font-semibold text-xs">{totalLoad}t</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-[hsl(var(--muted))]">Fire</span>
          <span className={`font-mono font-semibold text-xs ${riskColor}`}>%{avgFireRisk}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-[hsl(var(--muted))]">Kritik</span>
          <span className="font-mono font-semibold text-xs text-[hsl(var(--danger))]">{criticalLoca?.number ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
