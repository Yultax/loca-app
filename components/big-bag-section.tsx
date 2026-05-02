'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useSelectedLoca } from '@/hooks/use-loca-state';
import { useSensorRealtime } from '@/hooks/use-sensor-realtime';
import { BigBagList } from './big-bag-list';
import { CVDetectorModal } from './cv-detector-modal';
import type { BigBag, SensorReading } from '@/lib/types';

const CARD_SHADOW = 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)';

export function BigBagSection() {
  const loca = useSelectedLoca();
  const { currentReadings } = useSensorRealtime(loca?.id ?? null);
  const [selectedBagIndex, setSelectedBagIndex] = useState(0);
  const [cvOpen, setCvOpen] = useState(false);

  const liveReadingsMap = useMemo(() => {
    const m = new Map<string, SensorReading>();
    for (const r of currentReadings) {
      m.set(r.bigBagId, r.reading);
    }
    return m;
  }, [currentReadings]);

  if (!loca || !loca.varietyId) return null;

  const handleBagClick = (bag: BigBag) => {
    const idx = loca.bigBags.findIndex(b => b.id === bag.id);
    setSelectedBagIndex(idx >= 0 ? idx : 0);
    setCvOpen(true);
  };

  return (
    <>
      <Card
        className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <BigBagList
          bigBags={loca.bigBags}
          liveReadings={liveReadingsMap}
          fillDate={loca.fillDate}
          onBagClick={handleBagClick}
        />
      </Card>
      <CVDetectorModal
        bags={loca.bigBags}
        initialBagIndex={selectedBagIndex}
        fillDate={loca.fillDate}
        open={cvOpen}
        onOpenChange={setCvOpen}
      />
    </>
  );
}
