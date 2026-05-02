'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import type { ActionEntry } from '@/lib/types';

const POLL_INTERVAL = 3000;

const typeIcons: Record<ActionEntry['type'], string> = {
  ventilation: '🌬️',
  anomaly: '⚠️',
  recovery: '✅',
  system: '⚙️',
  detection: '🔍',
};

const typeColors: Record<ActionEntry['type'], string> = {
  ventilation: 'text-[hsl(var(--cave-blue))]',
  anomaly: 'text-[hsl(var(--warning))]',
  recovery: 'text-[hsl(var(--success))]',
  system: 'text-[hsl(var(--muted))]',
  detection: 'text-[hsl(var(--danger))]',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--:--';
  }
}

export function ActionLog() {
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchActions() {
      try {
        const res = await fetch('/api/actions');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.actions) {
          setActions(data.actions);
        }
      } catch {
        // fail-safe
      }
    }

    fetchActions();
    const interval = setInterval(fetchActions, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Card
      className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))]"
      style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-[hsl(var(--peri-orange))]" />
        <h3 className="text-sm font-semibold text-[hsl(var(--muted))] uppercase tracking-wider">
          Aksiyon Log
        </h3>
      </div>

      <div ref={scrollRef} className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin">
        {actions.length === 0 ? (
          <div className="text-xs text-[hsl(var(--muted))] text-center py-4 opacity-60">
            Henüz aksiyon yok
          </div>
        ) : (
          actions.map(action => (
            <div
              key={action.id}
              className="flex items-start gap-2 text-xs py-1 border-b border-[hsl(var(--border))]/30 last:border-0 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <span className="font-mono text-[hsl(var(--muted))] whitespace-nowrap shrink-0">
                {formatTime(action.timestamp)}
              </span>
              <span className="shrink-0">{typeIcons[action.type]}</span>
              <span className={`${typeColors[action.type]} leading-tight`}>
                <span className="font-semibold">{action.locaNumber}</span>
                {' — '}
                {action.description}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
