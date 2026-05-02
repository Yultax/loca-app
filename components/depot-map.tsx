'use client';

import { Warehouse } from 'lucide-react';
import { LocaCell } from '@/components/loca-cell';
import { DepotSummary } from '@/components/depot-summary';
import { useLocaState, useLocaDispatch } from '@/hooks/use-loca-state';
import { depots } from '@/lib/seed/depots';
import type { Loca } from '@/lib/types';

function LocaGrid({ locas, selectedLocaId, onSelect }: {
  locas: Loca[];
  selectedLocaId: string | null;
  onSelect: (id: string) => void;
}) {
  const leftLocas = locas.filter(l => l.position.side === 'left').sort((a, b) => a.position.row - b.position.row);
  const rightLocas = locas.filter(l => l.position.side === 'right').sort((a, b) => a.position.row - b.position.row);
  const maxRows = Math.max(
    leftLocas.length > 0 ? leftLocas[leftLocas.length - 1].position.row + 1 : 0,
    rightLocas.length > 0 ? rightLocas[rightLocas.length - 1].position.row + 1 : 0,
  );

  const leftByRow = new Map<number, Loca>();
  leftLocas.forEach(l => leftByRow.set(l.position.row, l));
  const rightByRow = new Map<number, Loca>();
  rightLocas.forEach(l => rightByRow.set(l.position.row, l));

  return (
    <div className="flex gap-0">
      {/* Left column */}
      <div className="flex-1 flex flex-col gap-1.5">
        {Array.from({ length: maxRows }, (_, row) => {
          const left = leftByRow.get(row);
          return (
            <div key={row}>
              {left ? (
                <LocaCell
                  loca={left}
                  isSelected={selectedLocaId === left.id}
                  onClick={() => onSelect(left.id)}
                />
              ) : (
                <div className="h-[46px]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Corridor — line, break for label, line */}
      <div className="relative flex-shrink-0 w-6 flex flex-col items-center mx-1">
        <div className="flex-1 w-[2px] rounded-full bg-[hsl(var(--muted))]/20" />
        <div className="py-1.5 flex flex-col items-center gap-[3px]">
          {'KORİDOR'.split('').map((ch, i) => (
            <span key={i} className="text-[8px] leading-none font-bold text-[hsl(var(--muted))]/50 select-none">
              {ch}
            </span>
          ))}
        </div>
        <div className="flex-1 w-[2px] rounded-full bg-[hsl(var(--muted))]/20" />
      </div>

      {/* Right column */}
      <div className="flex-1 flex flex-col gap-1.5">
        {Array.from({ length: maxRows }, (_, row) => {
          const right = rightByRow.get(row);
          return (
            <div key={row}>
              {right ? (
                <LocaCell
                  loca={right}
                  isSelected={selectedLocaId === right.id}
                  onClick={() => onSelect(right.id)}
                />
              ) : (
                <div className="h-[46px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DepotMap() {
  const { selectedDepotId, selectedLocaId } = useLocaState();
  const dispatch = useLocaDispatch();

  return (
    <div className="space-y-3">
      {/* Depot selector cards */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {depots.map(d => {
          const isActive = selectedDepotId === d.id;
          const filled = d.locas.filter(l => l.varietyId).length;
          return (
            <button
              key={d.id}
              onClick={() => dispatch({ type: 'SELECT_DEPOT', depotId: d.id })}
              className={`
                flex-shrink-0 rounded-lg border px-3 py-2 text-left transition-all min-w-[110px]
                ${isActive
                  ? 'border-l-[3px] border-[hsl(var(--peri-orange))] bg-[hsl(var(--peri-orange))]/10'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--cave-card))]/50 hover:bg-[hsl(var(--cave-card))]'}
              `}
              style={isActive ? { boxShadow: 'inset 0 0 12px rgba(0,0,0,0.3)' } : undefined}
            >
              <div className="flex items-center gap-1.5">
                <Warehouse className={`w-3.5 h-3.5 ${isActive ? 'text-[hsl(var(--peri-orange))]' : 'text-[hsl(var(--muted))]'}`} />
                <span className={`text-xs font-bold ${isActive ? 'text-[hsl(var(--peri-orange))]' : 'text-[hsl(var(--cream))]'}`}>
                  {d.name.replace(' Deposu', '')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[hsl(var(--muted))]">{d.city}</span>
                <span className="text-[10px] font-mono text-[hsl(var(--muted))]">{filled}/{d.locas.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active depot content */}
      {depots.filter(d => d.id === selectedDepotId).map(d => (
        <div key={d.id} className="space-y-3">
          <DepotSummary depot={d} />
          <LocaGrid
            locas={d.locas}
            selectedLocaId={selectedLocaId}
            onSelect={(id) => dispatch({ type: 'SELECT_LOCA', locaId: id })}
          />
        </div>
      ))}
    </div>
  );
}
