'use client';

import { useState } from 'react';
import { Thermometer, Droplets, Sprout, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BigBag, SensorReading } from '@/lib/types';

interface BigBagListProps {
  bigBags: BigBag[];
  liveReadings: Map<string, SensorReading>;
  fillDate: string | null;
  onBagClick: (bag: BigBag) => void;
}

const INITIAL_SHOW = 6;

export function BigBagList({ bigBags, liveReadings, onBagClick }: BigBagListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? bigBags : bigBags.slice(0, INITIAL_SHOW);
  const remaining = bigBags.length - INITIAL_SHOW;

  return (
    <div>
      <div className="text-xs font-semibold text-[hsl(var(--muted))] uppercase tracking-wider mb-3">
        Big-Bag Listesi ({bigBags.length})
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {displayed.map(bag => {
          const live = liveReadings.get(bag.id);
          const temp = live?.tempC ?? bag.sensors.tempC;
          const hum = live?.humidity ?? bag.sensors.humidity;

          return (
            <button
              key={bag.id}
              onClick={() => onBagClick(bag)}
              className="text-left p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--cave-card))] hover:border-[hsl(var(--peri-orange))]/50 transition-colors"
              style={{ boxShadow: 'inset 0 0 12px rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-[hsl(var(--muted))]">
                  {bag.id.split('-').slice(-2).join('-')}
                </span>
                <span className="text-xs font-mono text-[hsl(var(--cream))]/70">{bag.weightKg} kg</span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3 h-3 text-[hsl(var(--peri-orange))]" />
                  <span className="text-[hsl(var(--cream))]">{temp.toFixed(1)}°C</span>
                  <span className="text-[hsl(var(--muted))] ml-auto">Sensör</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3 h-3 text-[hsl(var(--cave-blue))]" />
                  <span className="text-[hsl(var(--cream))]">%{hum.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-3 h-3 text-[hsl(var(--success))]" />
                  <span className="text-[hsl(var(--cream))]">{bag.cvAnalysis.sproutCount} filiz</span>
                  <span className="flex items-center gap-0.5 ml-auto">
                    <AlertTriangle className="w-3 h-3 text-[hsl(var(--warning))]" />
                    <span className={bag.bruiseRiskScore > 25 ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--muted))]'}>
                      %{bag.bruiseRiskScore}
                    </span>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {!showAll && remaining > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full mt-2 text-[hsl(var(--peri-orange))] hover:text-[hsl(var(--peri-orange))] hover:bg-[hsl(var(--peri-orange))]/10"
        >
          +{remaining} daha
        </Button>
      )}
    </div>
  );
}
