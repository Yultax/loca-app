'use client';

import { Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocaRisk } from '@/hooks/use-loca-state';
import { varieties } from '@/lib/seed/varieties';
import type { Loca } from '@/lib/types';

interface LocaCellProps {
  loca: Loca;
  isSelected: boolean;
  onClick: () => void;
}

function daysInStorage(fillDate: string | null): number {
  if (!fillDate) return 0;
  const diff = Date.now() - new Date(fillDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function LocaCell({ loca, isSelected, onClick }: LocaCellProps) {
  const isEmpty = !loca.varietyId;
  const variety = loca.varietyId ? varieties.find(v => v.id === loca.varietyId) : null;
  const days = daysInStorage(loca.fillDate);
  const dormancy = variety?.dormancyDays ?? 0;
  const dormancyRemaining = Math.max(0, dormancy - days);
  const riskOverride = useLocaRisk(loca.id);
  const effectiveRisk = riskOverride?.fireRiskScore ?? loca.fireRiskScore;
  const effectiveStatus = riskOverride?.status ?? loca.status;

  if (isEmpty) {
    return (
      <button
        onClick={onClick}
        className={`
          relative h-[46px] rounded-lg border-2 border-dashed border-[hsl(var(--border))]
          bg-[hsl(var(--cave-card))]/30 transition-all hover:border-[hsl(var(--peri-orange))]/50
          group px-2 py-1.5 text-left w-full
          ${isSelected ? 'ring-2 ring-[hsl(var(--cave-blue))]' : ''}
        `}
        style={{ boxShadow: 'inset 0 0 12px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono text-[hsl(var(--muted))]">{loca.number}</div>
          <Plus className="w-3.5 h-3.5 text-[hsl(var(--muted))]/40 group-hover:text-[hsl(var(--peri-orange))] transition-colors" />
        </div>
        <div className="text-[10px] text-[hsl(var(--muted))]/60">Boş</div>
      </button>
    );
  }

  const statusStyles = {
    optimal: 'bg-[hsl(var(--success))]/15 border-[hsl(var(--success))]/40',
    warning: 'bg-[hsl(var(--warning))]/20 border-[hsl(var(--warning))]/50',
    critical: 'bg-[hsl(var(--danger))]/25 border-[hsl(var(--danger))]/60',
  }[effectiveStatus];

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={`
          relative h-[46px] rounded-lg border-2 ${statusStyles}
          ${isSelected ? 'ring-2 ring-[hsl(var(--cave-blue))] ring-offset-1 ring-offset-[hsl(var(--cave-bg))]' : ''}
          ${effectiveStatus === 'critical' ? 'alert-pulse' : ''}
          transition-all hover:scale-[1.03] px-2 py-1.5 text-left w-full
        `}
        style={{ boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono text-[hsl(var(--muted))]">{loca.number}</div>
          <div className={`text-[11px] font-mono font-bold ${
            effectiveStatus === 'critical' ? 'text-[hsl(var(--danger))]'
            : effectiveStatus === 'warning' ? 'text-[hsl(var(--warning))]'
            : 'text-[hsl(var(--success))]'
          }`}>
            %{effectiveRisk}
          </div>
        </div>
        <div className="text-[11px] font-semibold italic truncate text-[hsl(var(--cream))]">
          {variety?.name ?? loca.varietyId}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-[hsl(var(--cave-card))] border-[hsl(var(--border))] text-[hsl(var(--cream))] p-3 max-w-[220px]"
      >
        <div className="space-y-1.5">
          <div className="font-semibold text-sm">{loca.number} — {variety?.name ?? '?'}</div>
          <div className="text-xs space-y-0.5 font-mono">
            <div className="flex justify-between gap-4">
              <span className="text-[hsl(var(--muted))]">Yuk</span>
              <span>{loca.currentLoadTon} / {loca.capacityTon} ton</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[hsl(var(--muted))]">Depoda</span>
              <span>{days} gün</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[hsl(var(--muted))]">Dinlenme</span>
              <span>{dormancyRemaining} gün kaldı</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[hsl(var(--muted))]">Fire Risk</span>
              <span className={
                effectiveStatus === 'critical' ? 'text-[hsl(var(--danger))]'
                : effectiveStatus === 'warning' ? 'text-[hsl(var(--warning))]'
                : 'text-[hsl(var(--success))]'
              }>%{effectiveRisk}</span>
            </div>
            {loca.bigBags.length > 0 && (() => {
              const avgTemp = loca.bigBags.reduce((s, b) => s + b.sensors.tempC, 0) / loca.bigBags.length;
              const avgHum = loca.bigBags.reduce((s, b) => s + b.sensors.humidity, 0) / loca.bigBags.length;
              return (
                <>
                  <div className="flex justify-between gap-4">
                    <span className="text-[hsl(var(--muted))]">Sıcaklık</span>
                    <span>{avgTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[hsl(var(--muted))]">Nem</span>
                    <span>%{avgHum.toFixed(1)}</span>
                  </div>
                </>
              );
            })()}
          </div>
          <div className={`text-[10px] font-semibold mt-1 pt-1 border-t border-[hsl(var(--border))]/30 ${
            effectiveStatus === 'critical' ? 'text-[hsl(var(--danger))]'
            : effectiveStatus === 'warning' ? 'text-[hsl(var(--warning))]'
            : 'text-[hsl(var(--success))]'
          }`}>
            {effectiveStatus === 'optimal' ? '✓ Tüm parametreler güvenli'
            : effectiveStatus === 'warning' ? '⚠ Bazı değerler sınırda'
            : '✗ Acil müdahale gerekli'}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
