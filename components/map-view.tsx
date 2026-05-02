'use client';

import dynamic from 'next/dynamic';
import { useDecisionState } from '@/hooks/use-decision-state';
import { useSelectedDepot } from '@/hooks/use-loca-state';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MapInner = dynamic(() => import('./map-inner').then((m) => m.MapInner), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[300px] rounded-xl" />,
});

export function MapView() {
  const depot = useSelectedDepot();
  const { decision } = useDecisionState();

  // Build markers
  const markers: Array<{
    coords: [number, number];
    label: string;
    type: 'farmer' | 'depot' | 'buyer';
  }> = [];

  // Depot marker
  if (depot) {
    markers.push({
      coords: depot.coordinates,
      label: depot.name,
      type: 'depot',
    });
  }

  // If decision exists, add buyer + farmer from carbon chain
  if (decision?.carbonChain?.segments) {
    for (const seg of decision.carbonChain.segments) {
      if (seg.origin && seg.origin.coords) {
        const exists = markers.some(
          (m) => m.coords[0] === seg.origin.coords[0] && m.coords[1] === seg.origin.coords[1]
        );
        if (!exists) {
          markers.push({
            coords: seg.origin.coords,
            label: seg.origin.name,
            type: 'farmer',
          });
        }
      }
      if (seg.destination && seg.destination.coords) {
        const exists = markers.some(
          (m) =>
            m.coords[0] === seg.destination.coords[0] &&
            m.coords[1] === seg.destination.coords[1]
        );
        if (!exists) {
          // Last segment destination = buyer
          markers.push({
            coords: seg.destination.coords,
            label: seg.destination.name,
            type: 'buyer',
          });
        }
      }
    }
  }

  return (
    <Card
      className="p-0 overflow-hidden bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
      style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
    >
      {/* Header */}
      <div className="px-5 pt-3 pb-1">
        <h3 className="font-bold text-sm text-center">Sevkiyat Haritasi</h3>
      </div>

      {/* Map */}
      <div className="h-[300px] isolate">
        <MapInner
          markers={markers}
          routeGeoJSON={decision?.carbonChain?.routeGeoJSON}
          showRoute={true}
        />
      </div>
    </Card>
  );
}
