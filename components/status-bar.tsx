'use client';

import { useState, useEffect, useRef } from 'react';
import { Database, Wifi, WifiOff, Zap, Thermometer, Droplets, Wind, AlertTriangle, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTcmbRate } from '@/hooks/use-tcmb-rate';
import type { AnomalyType, ActionEntry } from '@/lib/types';

interface StatusBarProps {
  demoMode?: boolean;
  onDemoModeChange?: (enabled: boolean) => void;
  onTriggerAnomaly?: (type: AnomalyType) => void;
  canTrigger?: boolean;
  anomalyActive?: boolean;
  currentAnomalyType?: AnomalyType | null;
}

const ANOMALY_OPTIONS: Array<{ type: AnomalyType; label: string; icon: typeof Thermometer; desc: string }> = [
  { type: 'temp_high', label: 'Sıcaklık', icon: Thermometer, desc: 'Sıcaklık artışı simüle et' },
  { type: 'humidity_high', label: 'Nem', icon: Droplets, desc: 'Nem artışı simüle et' },
  { type: 'co2_spike', label: 'CO₂', icon: Wind, desc: 'CO₂ sivrilmesi simüle et' },
  { type: 'ammonia_spike', label: 'Amonyak', icon: AlertTriangle, desc: 'Amonyak artışı simüle et' },
];

const ANOMALY_LABELS: Record<AnomalyType, string> = {
  temp_high: 'Sıcaklık',
  humidity_high: 'Nem',
  co2_spike: 'CO₂',
  ammonia_spike: 'Amonyak',
};

const NOTIF_POLL_INTERVAL = 3000;

const typeIcons: Record<ActionEntry['type'], string> = {
  ventilation: '🌬️',
  anomaly: '⚠️',
  recovery: '✅',
  system: '⚙️',
  detection: '🔍',
};

function StatusIndicator({ source }: { source?: string; updatedAt?: string }) {
  if (!source) return <span className="text-[hsl(var(--danger))] text-xs flex items-center gap-1"><WifiOff className="w-3 h-3" /> Veri yok</span>;
  if (source === 'cache') return <span className="text-[hsl(var(--warning))] text-xs">Onbellek</span>;
  if (source === 'fallback-xml') return <span className="text-[hsl(var(--warning))] text-xs flex items-center gap-1"><Database className="w-3 h-3" /> Yedek kaynak</span>;
  return <span className="text-[hsl(var(--success))] text-xs flex items-center gap-1"><Wifi className="w-3 h-3" /> Canli</span>;
}

function formatTime(isoOrDate?: string) {
  if (!isoOrDate) return '--:--';
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return isoOrDate;
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoOrDate;
  }
}

export function StatusBar({ demoMode, onDemoModeChange, onTriggerAnomaly, canTrigger, anomalyActive, currentAnomalyType }: StatusBarProps) {
  const { rate, isLoading, isError } = useTcmbRate();
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const lastSeenCount = useRef(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchActions() {
      try {
        const res = await fetch('/api/actions');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.actions) {
          setActions(data.actions);
          setUnreadCount(Math.max(0, data.actions.length - lastSeenCount.current));
        }
      } catch { /* fail-safe */ }
    }
    fetchActions();
    const interval = setInterval(fetchActions, NOTIF_POLL_INTERVAL);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  function handleNotifOpen() {
    lastSeenCount.current = actions.length;
    setUnreadCount(0);
  }

  const usdTry = rate?.rates?.USD_TRY ?? rate?.fallback?.USD_TRY;
  const eurTry = rate?.rates?.EUR_TRY ?? rate?.fallback?.EUR_TRY;
  const hasData = !isLoading || isError || rate;

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--cave-bg))]/95 backdrop-blur px-6 flex items-center gap-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-[hsl(var(--peri-orange))] flex items-center justify-center">
          <Database className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">LOCA</span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {!hasData ? (
          <>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </>
        ) : (
          <>
            <span className="font-mono">
              USD/TRY: <span className="text-[hsl(var(--peri-orange))] font-semibold">{usdTry?.toFixed(2) ?? '--'}</span>
            </span>
            <span className="font-mono">
              EUR/TRY: <span className="text-[hsl(var(--peri-orange))] font-semibold">{eurTry?.toFixed(2) ?? '--'}</span>
            </span>
            <StatusIndicator source={rate?.source ?? (rate?.error ? undefined : undefined)} updatedAt={rate?.updatedAt} />
            <span className="text-[hsl(var(--muted))] text-xs">
              {formatTime(rate?.updatedAt)}
            </span>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--peri-orange))]/20 flex items-center justify-center text-base leading-none border border-[hsl(var(--peri-orange))]/40">
            🏔️
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold text-[hsl(var(--cream))] leading-tight">Kapadokya Tohumculuk</span>
            <span className="text-[10px] text-[hsl(var(--muted))] leading-tight">Mehmet Bey — Depo Sorumlusu</span>
          </div>
        </div>

        {/* Notification Bell */}
        <DropdownMenu onOpenChange={(open) => { if (open) handleNotifOpen(); }}>
          <DropdownMenuTrigger className="relative p-1.5 rounded-md hover:bg-[hsl(var(--cave-bg))] transition-colors">
            <Bell className="w-4.5 h-4.5 text-[hsl(var(--muted))] hover:text-[hsl(var(--cream))]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(var(--danger))] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[hsl(var(--cave-card))] border-[hsl(var(--border))] w-[340px]"
          >
            <div className="text-[hsl(var(--muted))] uppercase tracking-wider text-[10px] font-semibold px-3 py-2">
              Bildirimler
            </div>
            <DropdownMenuSeparator className="bg-[hsl(var(--border))]" />
            {actions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[hsl(var(--muted))] opacity-60">
                Bildirim yok
              </div>
            ) : (
              actions.slice(0, 8).map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  className="flex items-start gap-2 px-3 py-2 cursor-default focus:bg-[hsl(var(--cave-bg))]"
                >
                  <span className="shrink-0 mt-0.5">{typeIcons[action.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[hsl(var(--cream))] truncate">{action.locaNumber}</span>
                      <span className="text-[10px] font-mono text-[hsl(var(--muted))] whitespace-nowrap shrink-0">
                        {formatTime(action.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[hsl(var(--muted))] leading-snug truncate">{action.description}</p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Demo Mode Toggle */}
        <button
          onClick={() => onDemoModeChange?.(!demoMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            demoMode
              ? 'bg-[hsl(var(--peri-orange))]/20 text-[hsl(var(--peri-orange))] ring-1 ring-[hsl(var(--peri-orange))]/40'
              : 'bg-[hsl(var(--cave-bg))] text-[hsl(var(--muted))] hover:text-[hsl(var(--cream))]'
          }`}
        >
          <div className={`w-2 h-2 rounded-full transition-colors ${demoMode ? 'bg-[hsl(var(--peri-orange))] animate-pulse' : 'bg-[hsl(var(--muted))]'}`} />
          Demo
        </button>

        {/* Anomaly Trigger Dropdown (visible only in demo mode) */}
        {demoMode && (
          anomalyActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[hsl(var(--danger))]/20 text-[hsl(var(--danger))]">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              {currentAnomalyType ? ANOMALY_LABELS[currentAnomalyType] : 'Anomali'} Aktif...
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={!canTrigger}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  canTrigger
                    ? 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/30 active:scale-95'
                    : 'bg-[hsl(var(--cave-bg))] text-[hsl(var(--muted))] cursor-not-allowed opacity-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Anomali Tetikle
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[hsl(var(--cave-card))] border-[hsl(var(--border))] min-w-[200px]"
              >
                {ANOMALY_OPTIONS.map(({ type, label, icon: Icon, desc }) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => onTriggerAnomaly?.(type)}
                    className="flex items-center gap-2 cursor-pointer focus:bg-[hsl(var(--cave-bg))]"
                  >
                    <Icon className="w-4 h-4 text-[hsl(var(--peri-orange))]" />
                    <div>
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs text-[hsl(var(--muted))]">{desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}

      </div>
    </header>
  );
}
