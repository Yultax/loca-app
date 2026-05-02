'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Eye, CircleDot, Sprout,
  Layers, Ruler, AlertTriangle, X, Camera, Thermometer,
} from 'lucide-react';
import { TraceabilityTimeline } from './traceability-timeline';
import type { BigBag } from '@/lib/types';

/* ── props ── */
interface CVDetectorModalProps {
  bags: BigBag[];
  initialBagIndex: number;
  fillDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewTab = 'rgb' | 'thermal';

/* ── mock data ── */
const MOCK_BOXES: Record<number, Array<{ x: number; y: number; w: number; h: number; label: string }>> = {
  0: [
    { x: 10, y: 15, w: 18, h: 20, label: 'patates' },
    { x: 35, y: 25, w: 15, h: 18, label: 'patates' },
    { x: 60, y: 10, w: 20, h: 22, label: 'filiz' },
    { x: 55, y: 55, w: 16, h: 19, label: 'patates' },
  ],
  1: [
    { x: 8, y: 20, w: 22, h: 24, label: 'patates' },
    { x: 40, y: 10, w: 17, h: 20, label: 'patates' },
    { x: 65, y: 40, w: 20, h: 18, label: 'çürük' },
  ],
  2: [
    { x: 12, y: 12, w: 20, h: 22, label: 'patates' },
    { x: 38, y: 30, w: 18, h: 20, label: 'patates' },
    { x: 62, y: 15, w: 16, h: 18, label: 'filiz' },
    { x: 20, y: 55, w: 22, h: 20, label: 'patates' },
    { x: 70, y: 60, w: 15, h: 17, label: 'toprak' },
  ],
  3: [
    { x: 15, y: 18, w: 20, h: 22, label: 'patates' },
    { x: 45, y: 35, w: 18, h: 20, label: 'patates' },
    { x: 68, y: 8, w: 17, h: 19, label: 'filiz' },
  ],
  4: [
    { x: 5, y: 25, w: 24, h: 26, label: 'patates' },
    { x: 35, y: 15, w: 20, h: 22, label: 'patates' },
    { x: 60, y: 50, w: 18, h: 20, label: 'patates' },
    { x: 72, y: 10, w: 14, h: 16, label: 'çürük' },
  ],
  5: [
    { x: 10, y: 10, w: 22, h: 24, label: 'patates' },
    { x: 40, y: 20, w: 18, h: 20, label: 'filiz' },
    { x: 65, y: 35, w: 20, h: 22, label: 'patates' },
    { x: 25, y: 55, w: 16, h: 18, label: 'toprak' },
    { x: 50, y: 60, w: 19, h: 17, label: 'patates' },
  ],
};

const IMAGE_URLS = Array.from({ length: 6 }, (_, i) =>
  `https://picsum.photos/seed/potato${i}/400/300`
);

/* ── sub-components ── */

function BoundingBoxOverlay({ boxes }: { boxes: typeof MOCK_BOXES[0] }) {
  return (
    <>
      {boxes.map((box, i) => (
        <div
          key={i}
          className="absolute border-2 border-[hsl(var(--peri-orange))] rounded-sm"
          style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
        >
          <span className="absolute -top-4 left-0 text-[9px] font-mono bg-[hsl(var(--peri-orange))] text-white px-1 rounded-sm">
            {box.label}
          </span>
        </div>
      ))}
    </>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div
      className="rounded-lg border border-[hsl(var(--border))] px-3 py-2 flex items-center gap-3"
      style={{ boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)' }}
    >
      <div className="text-[hsl(var(--muted))]">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] text-[hsl(var(--muted))] uppercase tracking-wider">{label}</div>
        <div className={`text-lg font-mono font-bold leading-tight ${color ?? ''}`}>{value}</div>
      </div>
    </div>
  );
}

/* ── main ── */

export function CVDetectorModal({ bags, initialBagIndex, fillDate, open, onOpenChange }: CVDetectorModalProps) {
  const [bagIdx, setBagIdx] = useState(initialBagIndex);
  const [imgIdx, setImgIdx] = useState(0);
  const [imgErr, setImgErr] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<ViewTab>('rgb');

  useEffect(() => {
    if (open) { setBagIdx(initialBagIndex); setImgIdx(0); setImgErr({}); setActiveTab('rgb'); }
  }, [open, initialBagIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const onImgErr = useCallback((i: number) => setImgErr(p => ({ ...p, [i]: true })), []);

  if (!open || bags.length === 0) return null;

  const bag = bags[bagIdx] ?? bags[0];
  const boxes = MOCK_BOXES[imgIdx] ?? MOCK_BOXES[0];
  const cv = bag.cvAnalysis;
  const shortId = (id: string) => id.split('-').slice(-2).join('-');
  const isThermal = activeTab === 'thermal';

  const goBag = (dir: -1 | 1) => { setBagIdx(i => (i + dir + bags.length) % bags.length); setImgIdx(0); setImgErr({}); };
  const goImg = (dir: -1 | 1) => setImgIdx(i => (i + dir + 6) % 6);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-[960px] max-w-[calc(100vw-2rem)] max-h-[85vh] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--cave-card))] text-[hsl(var(--cream))] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200"
          style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
        >
          {/* ─── Header ─── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <button onClick={() => goBag(-1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-2">
                <Eye className="w-5 h-5 text-[hsl(var(--peri-orange))]" />
                <span className="font-semibold">CV Tespit</span>
                <span className="font-mono text-[hsl(var(--peri-orange))]">{shortId(bag.id)}</span>
              </div>
              <button onClick={() => goBag(1)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-[hsl(var(--muted))] ml-1 tabular-nums">
                {bagIdx + 1}/{bags.length}
              </span>
            </div>

            {/* RGB / Termal toggle */}
            <div className="flex items-center gap-0.5 bg-[hsl(var(--cave-bg))] rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('rgb')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'rgb'
                    ? 'bg-[hsl(var(--peri-orange))] text-white shadow-sm'
                    : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--cream))] hover:bg-white/5'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>RGB</span>
              </button>
              <button
                onClick={() => setActiveTab('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'thermal'
                    ? 'bg-[hsl(var(--peri-orange))] text-white shadow-sm'
                    : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--cream))] hover:bg-white/5'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>Termal</span>
              </button>
            </div>

            <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ─── Body ─── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 min-h-0">
            <div className="flex flex-col md:flex-row gap-5">
              {/* Left — image + thumbnails */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                {/* Main image */}
                <div className="relative rounded-xl overflow-hidden bg-black h-[280px] flex-shrink-0">
                  {imgErr[imgIdx] ? (
                    <div className="w-full h-full flex items-center justify-center bg-[hsl(var(--cave-bg))] text-[hsl(var(--muted))]">
                      <div className="text-center space-y-1">
                        <div className="text-3xl">🥔</div>
                        <p className="text-[11px]">Görüntü yüklenemedi</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={IMAGE_URLS[imgIdx]}
                        alt={`${isThermal ? 'Termal' : 'RGB'} görsel ${imgIdx + 1}`}
                        className="w-full h-full object-cover"
                        style={isThermal ? { filter: 'hue-rotate(180deg) saturate(2)' } : undefined}
                        onError={() => onImgErr(imgIdx)}
                      />
                      <BoundingBoxOverlay boxes={boxes} />
                    </>
                  )}

                  {/* Prev/Next overlay */}
                  <button
                    onClick={() => goImg(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => goImg(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Counter */}
                  <div className="absolute top-2 right-2 bg-black/60 rounded-md px-2 py-0.5 text-[11px] font-mono tabular-nums">
                    {imgIdx + 1}/6
                  </div>
                </div>

                {/* Thumbnail strip */}
                <div className="flex gap-1.5">
                  {Array.from({ length: 6 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`relative flex-1 h-[48px] rounded-lg overflow-hidden transition-all ${
                        i === imgIdx
                          ? 'ring-2 ring-[hsl(var(--peri-orange))] ring-offset-1 ring-offset-[hsl(var(--cave-card))]'
                          : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={IMAGE_URLS[i]}
                        alt={`Thumb ${i + 1}`}
                        className="w-full h-full object-cover"
                        style={isThermal ? { filter: 'hue-rotate(180deg) saturate(2)' } : undefined}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right — metrics */}
              <div className="w-full md:w-[210px] flex-shrink-0 flex flex-col gap-2">
                <div className="text-[10px] font-semibold text-[hsl(var(--muted))] uppercase tracking-wider mb-0.5">
                  Tespit Özeti
                </div>
                <MetricCard icon={<CircleDot className="w-4 h-4" />} label="Patates" value={cv.potatoCount} />
                <MetricCard icon={<Sprout className="w-4 h-4" />} label="Filiz" value={cv.sproutCount} color={cv.sproutCount > 2 ? 'text-[hsl(var(--warning))]' : ''} />
                <MetricCard icon={<Layers className="w-4 h-4" />} label="Toprak%" value={cv.soilCoverage} />
                <MetricCard icon={<Ruler className="w-4 h-4" />} label="Ort. Boy" value={`${cv.averageSizeMm}mm`} />
                <MetricCard icon={<AlertTriangle className="w-4 h-4" />} label="Çürük" value={cv.bruiseCount} color={cv.bruiseCount > 1 ? 'text-[hsl(var(--danger))]' : ''} />
              </div>
            </div>

            {/* ─── Traceability ─── */}
            <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
              <TraceabilityTimeline bag={bag} fillDate={fillDate ?? null} />
            </div>
          </div>

          {/* ─── Footer ─── */}
          <div className="px-5 py-2 border-t border-[hsl(var(--border))] flex-shrink-0">
            <p className="text-[10px] text-[hsl(var(--muted))]/60 italic">
              Bu modülün gerçek implementasyonu YOLOv8 + custom dataset ile yapılacaktır. Görseller ve tespitler mock veridir.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
