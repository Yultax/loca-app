'use client';

import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { SensorHistoryPoint } from '@/hooks/use-sensor-realtime';
import type { PotatoVariety } from '@/lib/types';

interface SensorChartsProps {
  history: SensorHistoryPoint[];
  variety: PotatoVariety | null;
  isLoading: boolean;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CaveTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border border-[hsl(var(--border))] p-2 text-xs font-mono"
      style={{ background: 'hsl(28 19% 13%)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
    >
      <div className="text-[hsl(var(--muted))] mb-1">{formatTime(label)}</div>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex justify-between gap-3" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SensorCharts({ history, variety, isLoading }: SensorChartsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-[140px] w-full" />
          <Skeleton className="h-[140px] w-full" />
        </div>
        <Skeleton className="h-[140px] w-full" />
      </div>
    );
  }

  const gridStroke = 'hsl(24 30% 22% / 0.5)';
  const axisStyle = { fontSize: 10, fill: 'hsl(30 15% 59%)' };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Temperature */}
        <div>
          <div className="text-xs font-semibold text-[hsl(var(--muted))] uppercase tracking-wider mb-1">
            Sıcaklık (°C)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={axisStyle} />
              <YAxis
                tick={axisStyle}
                domain={variety
                  ? [variety.optimalTempC[0] - 3, variety.optimalTempC[1] + 5]
                  : ['auto', 'auto']}
              />
              <Tooltip content={<CaveTooltip />} />
              {variety && (
                <ReferenceArea
                  y1={variety.optimalTempC[0]}
                  y2={variety.optimalTempC[1]}
                  fill="hsl(130 22% 54%)"
                  fillOpacity={0.15}
                />
              )}
              <Area
                type="monotone"
                dataKey="avgTemp"
                name="Sıcaklık"
                stroke="hsl(16 78% 62%)"
                fill="hsl(16 78% 62%)"
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Humidity */}
        <div>
          <div className="text-xs font-semibold text-[hsl(var(--muted))] uppercase tracking-wider mb-1">
            Nem (%)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={axisStyle} />
              <YAxis
                tick={axisStyle}
                domain={variety
                  ? [variety.optimalHumidity[0] - 5, variety.optimalHumidity[1] + 3]
                  : ['auto', 'auto']}
              />
              <Tooltip content={<CaveTooltip />} />
              {variety && (
                <ReferenceArea
                  y1={variety.optimalHumidity[0]}
                  y2={variety.optimalHumidity[1]}
                  fill="hsl(130 22% 54%)"
                  fillOpacity={0.15}
                />
              )}
              <Area
                type="monotone"
                dataKey="avgHumidity"
                name="Nem"
                stroke="hsl(217 39% 39%)"
                fill="hsl(217 39% 39%)"
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gas Combo — full width */}
      <div>
        <div className="text-xs font-semibold text-[hsl(var(--muted))] uppercase tracking-wider mb-1">
          Gaz Seviyeleri
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={axisStyle} />
            <YAxis
              yAxisId="left"
              tick={axisStyle}
              domain={variety
                ? [0, variety.optimalCo2ppm[1] + 500]
                : ['auto', 'auto']}
            />
            <YAxis yAxisId="right" orientation="right" tick={axisStyle} />
            <Tooltip content={<CaveTooltip />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgCo2"
              name="CO₂ (ppm)"
              stroke="hsl(217 39% 39%)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgAmmonia"
              name="NH₃ (ppm)"
              stroke="hsl(41 65% 55%)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgEthylene"
              name="C₂H₄ (ppb)"
              stroke="hsl(0 50% 47%)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
