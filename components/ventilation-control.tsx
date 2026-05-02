'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Wind, Thermometer, Droplets, Snowflake, AlertTriangle, Eye } from 'lucide-react';
import type { VentilationDecision } from '@/lib/types';

interface Props {
  decision: VentilationDecision | null;
  visible: boolean;
  onClose?: () => void;
}

function AnimatedNumber({ value, decimals = 1, className = '' }: { value: number; decimals?: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number>(0);
  const currentRef = useRef(value);

  useEffect(() => {
    const target = value;
    const start = currentRef.current;
    const duration = 600;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const current = start + (target - start) * eased;
      currentRef.current = current;
      setDisplay(current);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}

// SVG Kepenk (damper) animation
function KepenkAnimation({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="flex items-center justify-center py-4">
      <svg width="120" height="80" viewBox="0 0 120 80" className="overflow-visible">
        <rect x="10" y="5" width="100" height="70" fill="none" stroke="hsl(30 15% 59%)" strokeWidth="2" rx="4" />
        {[0, 1, 2, 3].map(i => (
          <g key={i} transform={`translate(${20 + i * 24}, 40)`}>
            <rect
              x="-8" y="-25" width="16" height="50"
              fill={isOpen ? 'hsl(130 22% 54%)' : 'hsl(24 30% 22%)'}
              stroke="hsl(30 15% 45%)"
              strokeWidth="1"
              rx="2"
              style={{
                transformOrigin: '0px -25px',
                transform: isOpen ? 'rotateY(75deg)' : 'rotateY(0deg)',
                transition: 'transform 0.6s ease-in-out, fill 0.4s ease',
              }}
            />
          </g>
        ))}
        {isOpen && (
          <g className="animate-pulse" opacity="0.7">
            <path d="M 5 25 L -10 25" stroke="hsl(130 22% 54%)" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <path d="M 5 40 L -10 40" stroke="hsl(130 22% 54%)" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <path d="M 5 55 L -10 55" stroke="hsl(130 22% 54%)" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <path d="M 115 25 L 130 25" stroke="hsl(217 39% 39%)" strokeWidth="2" markerEnd="url(#arrowOut)" />
            <path d="M 115 40 L 130 40" stroke="hsl(217 39% 39%)" strokeWidth="2" markerEnd="url(#arrowOut)" />
            <path d="M 115 55 L 130 55" stroke="hsl(217 39% 39%)" strokeWidth="2" markerEnd="url(#arrowOut)" />
          </g>
        )}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M 0 0 L 8 3 L 0 6 Z" fill="hsl(130 22% 54%)" />
          </marker>
          <marker id="arrowOut" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M 0 0 L 8 3 L 0 6 Z" fill="hsl(217 39% 39%)" />
          </marker>
        </defs>
      </svg>
      <div className="ml-4 text-sm">
        <div className="font-mono font-bold text-[hsl(var(--success))]">KEPENK AÇIK</div>
        <div className="text-xs text-[hsl(var(--muted))]">Hava akışı aktif</div>
      </div>
    </div>
  );
}

function ChillerAnimation() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative">
        <Snowflake className="w-16 h-16 text-[hsl(var(--cave-blue))] animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--cave-blue))]/20 animate-ping" />
        </div>
      </div>
      <div className="ml-4 text-sm">
        <div className="font-mono font-bold text-[hsl(var(--cave-blue))]">CHILLER AKTIF</div>
        <div className="text-xs text-[hsl(var(--muted))]">Mekanik soğutma çalışıyor</div>
      </div>
    </div>
  );
}

function DehumidifierAnimation() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative">
        <Droplets className="w-16 h-16 text-[hsl(var(--cave-blue))]" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <div className="w-3 h-3 rounded-full bg-[hsl(var(--cave-blue))]/60 animate-bounce" style={{ animationDelay: '0s' }} />
        </div>
        <div className="absolute -bottom-1 left-1/3">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--cave-blue))]/40 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
        <div className="absolute -bottom-1 left-2/3">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--cave-blue))]/40 animate-bounce" style={{ animationDelay: '0.6s' }} />
        </div>
      </div>
      <div className="ml-4 text-sm">
        <div className="font-mono font-bold text-[hsl(var(--cave-blue))]">NEM ALICI AKTIF</div>
        <div className="text-xs text-[hsl(var(--muted))]">Nem düşürülüyor</div>
      </div>
    </div>
  );
}

function AlertAnimation() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative">
        <AlertTriangle className="w-16 h-16 text-[hsl(var(--danger))] animate-pulse" />
      </div>
      <div className="ml-4 text-sm">
        <div className="font-mono font-bold text-[hsl(var(--danger))]">UYARI</div>
        <div className="text-xs text-[hsl(var(--muted))]">Manuel müdahale gerekli</div>
      </div>
    </div>
  );
}

function MonitorAnimation() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative">
        <Eye className="w-16 h-16 text-[hsl(var(--warning))]" />
        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[hsl(var(--warning))] animate-ping" />
      </div>
      <div className="ml-4 text-sm">
        <div className="font-mono font-bold text-[hsl(var(--warning))]">İZLEME MODU</div>
        <div className="text-xs text-[hsl(var(--muted))]">Değerler izleniyor</div>
      </div>
    </div>
  );
}

function ActionAnimation({ decision }: { decision: string }) {
  switch (decision) {
    case 'damper_open':
      return <KepenkAnimation isOpen={true} />;
    case 'chiller_on':
      return <ChillerAnimation />;
    case 'dehumidifier_on':
      return <DehumidifierAnimation />;
    case 'alert':
      return <AlertAnimation />;
    case 'monitor_only':
      return <MonitorAnimation />;
    default:
      return <KepenkAnimation isOpen={true} />;
  }
}

const ACTION_BANNER_TEXT: Record<string, string> = {
  damper_open: 'HAVALANDIRMA AÇILIYOR',
  chiller_on: 'MEKANİK SOĞUTMA AKTİF',
  dehumidifier_on: 'NEM ALICI DEVREDE',
  alert: 'ACİL MÜDAHALE GEREKLİ',
  monitor_only: 'İZLEME MODUNDA',
};

export function VentilationControl({ decision, visible }: Props) {
  if (!visible || !decision) return null;

  const indicators = decision.indicators;
  const internalTemp = decision.internalConditions.tempC;
  const internalHum = decision.internalConditions.humidity;
  const externalTemp = decision.externalConditions.tempC;
  const externalHum = decision.externalConditions.humidity;

  const actionLabel = decision.actionLabel ?? (decision.decision === 'damper_open' ? 'Kepenk Aç' : 'Aksiyon');
  const actionIcon = decision.actionIcon ?? 'wind';
  const bannerText = ACTION_BANNER_TEXT[decision.decision] ?? actionLabel.toUpperCase();

  const ActionIcon = actionIcon === 'snowflake' ? Snowflake
    : actionIcon === 'droplets' ? Droplets
    : actionIcon === 'alert-triangle' ? AlertTriangle
    : actionIcon === 'eye' ? Eye
    : Wind;

  const isAlert = decision.decision === 'alert';
  const bannerBg = isAlert
    ? 'bg-[hsl(var(--danger))]/20 border-[hsl(var(--danger))]/50'
    : 'bg-[hsl(var(--success))]/20 border-[hsl(var(--success))]/50';
  const bannerTextColor = isAlert ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--success))]';

  return (
    <Card
      className="p-5 bg-[hsl(var(--cave-card))] border-[hsl(var(--border))] ventilation-panel-enter overflow-hidden"
      style={{
        boxShadow: isAlert
          ? 'inset 0 0 30px rgba(200,50,50,0.2), 0 4px 12px rgba(0,0,0,0.3), 0 0 40px rgba(200,50,50,0.15)'
          : 'inset 0 0 30px rgba(111,165,119,0.2), 0 4px 12px rgba(0,0,0,0.3), 0 0 40px rgba(111,165,119,0.15)',
        transition: 'box-shadow 0.4s ease',
      }}
    >
      {/* GIANT ACTION BANNER */}
      <div className={`rounded-xl border-2 ${bannerBg} p-6 mb-4 flex flex-col items-center justify-center gap-3 animate-pulse`}>
        <ActionIcon className={`w-12 h-12 ${bannerTextColor}`} />
        <div className={`text-2xl md:text-3xl font-black tracking-wide text-center ${bannerTextColor}`}>
          {bannerText}
        </div>
        <div className="text-sm text-[hsl(var(--cream))] font-medium text-center">
          {decision.reasoning}
        </div>
      </div>

      {/* Compact info rows — stacked for narrow panel */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1.5 bg-[hsl(var(--cave-bg))] rounded px-2 py-1.5">
          <Thermometer className="w-3.5 h-3.5 text-[hsl(var(--danger))] shrink-0" />
          <span className="text-[hsl(var(--muted))]">İç</span>
          <AnimatedNumber value={internalTemp} className="font-mono font-bold text-[hsl(var(--cream))]" />
          <span className="text-[hsl(var(--muted))]">°C</span>
          <AnimatedNumber value={internalHum} decimals={0} className="font-mono font-bold text-[hsl(var(--cream))]" />
          <span className="text-[hsl(var(--muted))]">%</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[hsl(var(--cave-bg))] rounded px-2 py-1.5">
          <Droplets className="w-3.5 h-3.5 text-[hsl(var(--cave-blue))] shrink-0" />
          <span className="text-[hsl(var(--muted))]">Dış</span>
          <AnimatedNumber value={externalTemp} className="font-mono font-bold text-[hsl(var(--cream))]" />
          <span className="text-[hsl(var(--muted))]">°C</span>
          <AnimatedNumber value={externalHum} decimals={0} className="font-mono font-bold text-[hsl(var(--cream))]" />
          <span className="text-[hsl(var(--muted))]">%</span>
        </div>
      </div>

      {/* Enthalpy compact */}
      <div className="bg-[hsl(var(--cave-bg))] rounded-lg p-3 font-mono text-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[hsl(var(--peri-orange))] text-xs font-semibold">ENTALPI</span>
          <span className="text-[hsl(var(--warning))]">{indicators?.intEnthalpy ?? 0}</span>
          <span className="text-[hsl(var(--muted))]">→</span>
          <span className="text-[hsl(var(--cave-blue))]">{indicators?.extEnthalpy ?? 0}</span>
          <span className="text-[hsl(var(--muted))]">kJ/kg</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[hsl(var(--muted))]">Δ</span>
          <AnimatedNumber
            value={indicators?.enthalpyDelta ?? 0}
            className={`font-bold ${(indicators?.enthalpyDelta ?? 0) > 1.5 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}
          />
        </div>
      </div>

      {/* Action Animation */}
      <ActionAnimation decision={decision.decision} />


    </Card>
  );
}
