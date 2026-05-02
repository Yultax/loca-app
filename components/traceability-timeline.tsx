'use client';

import { Sprout, SprayCan, Tractor, Warehouse, CalendarCheck } from 'lucide-react';
import type { BigBag } from '@/lib/types';

interface TraceabilityTimelineProps {
  bag: BigBag;
  fillDate: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function daysFromNow(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

interface TimelineNode {
  icon: React.ReactNode;
  label: string;
  date: string;
  sublabel?: string;
}

export function TraceabilityTimeline({ bag, fillDate }: TraceabilityTimelineProps) {
  const storageDate = fillDate
    ?? new Date(new Date(bag.harvestDate).getTime() + bag.harvestToStorageDays * 86400000)
        .toISOString().split('T')[0];

  const pesticideToHarvestDays = daysBetween(bag.lastPesticideDate, bag.harvestDate);

  const nodes: TimelineNode[] = [
    {
      icon: <Sprout className="w-3.5 h-3.5" />,
      label: 'Gübre',
      date: formatDate(bag.lastFertilizationDate),
    },
    {
      icon: <SprayCan className="w-3.5 h-3.5" />,
      label: 'İlaç',
      date: formatDate(bag.lastPesticideDate),
      sublabel: `+${daysBetween(bag.lastFertilizationDate, bag.lastPesticideDate)}g`,
    },
    {
      icon: <CalendarCheck className="w-3.5 h-3.5" />,
      label: `${pesticideToHarvestDays}g bekl.`,
      date: '',
    },
    {
      icon: <Tractor className="w-3.5 h-3.5" />,
      label: 'Hasat',
      date: formatDate(bag.harvestDate),
    },
    {
      icon: <Warehouse className="w-3.5 h-3.5" />,
      label: 'Depo',
      date: formatDate(storageDate),
      sublabel: `+${bag.harvestToStorageDays}g`,
    },
    {
      icon: <CalendarCheck className="w-3.5 h-3.5" />,
      label: 'Bugün',
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      sublabel: `${daysFromNow(storageDate)}g depoda`,
    },
  ];

  return (
    <div className="flex items-start justify-between gap-0">
      {nodes.map((node, i) => (
        <div key={i} className="flex items-start flex-1 min-w-0">
          {/* Node */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[hsl(var(--peri-orange))]/20 text-[hsl(var(--peri-orange))] flex items-center justify-center flex-shrink-0">
              {node.icon}
            </div>
            <div className="text-[11px] font-semibold text-[hsl(var(--cream))] mt-1 text-center leading-tight truncate w-full px-0.5">
              {node.label}
            </div>
            {node.date && (
              <div className="text-[10px] font-mono text-[hsl(var(--muted))] leading-tight">
                {node.date}
              </div>
            )}
            {node.sublabel && (
              <div className="text-[9px] font-mono text-[hsl(var(--peri-orange))] leading-tight">
                {node.sublabel}
              </div>
            )}
          </div>
          {/* Connector */}
          {i < nodes.length - 1 && (
            <div className="flex items-center mt-3 mx-0">
              <div className="w-4 h-px bg-[hsl(var(--peri-orange))]/40" />
              <div className="w-0 h-0 border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent border-l-[3px] border-l-[hsl(var(--peri-orange))]/40" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
