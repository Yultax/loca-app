'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Database, X } from 'lucide-react';

export function HeroOverlay() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  const dismiss = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem('hero_seen', 'true');
    }, 500);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem('hero_seen');
    if (!seen) {
      setVisible(true);
      timerRef.current = setTimeout(() => dismiss(), 10000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'rgba(27, 20, 16, 0.95)' }}
    >
      {/* Skip button */}
      <button
        onClick={dismiss}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--cave-card))] border border-[hsl(var(--border))] text-[hsl(var(--cream))] text-sm hover:bg-[hsl(var(--peri-orange))]/20 transition-colors z-10"
      >
        <X className="w-4 h-4" />
        Gecis
      </button>

      {/* Video or Fallback Splash */}
      {!videoFailed ? (
        <video
          ref={videoRef}
          src="/videos/hero.mp4"
          autoPlay
          muted
          playsInline
          onError={() => setVideoFailed(true)}
          onEnded={dismiss}
          className="max-w-[800px] w-full rounded-2xl shadow-2xl"
        />
      ) : (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
          {/* Branded splash fallback */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[hsl(var(--peri-orange))] to-[hsl(var(--earth-brown))] flex items-center justify-center shadow-2xl">
            <Database className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-[hsl(var(--cream))] tracking-tight">
            LOCA
          </h1>
          <p className="text-lg text-[hsl(var(--muted))] max-w-md text-center leading-relaxed">
            Cave2Cloud Smart Potato Storage Intelligence
          </p>
          <p className="text-sm text-[hsl(var(--peri-orange))] italic">
            Yer altinin zekasi, ureticinin cebinde.
          </p>

          {/* Progress bar */}
          <div className="w-48 h-1 rounded-full bg-[hsl(var(--border))] mt-4 overflow-hidden">
            <div
              className="h-full bg-[hsl(var(--peri-orange))] rounded-full"
              style={{ animation: 'hero-progress 10s linear forwards' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
