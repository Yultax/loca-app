'use client';

import { StatusBar } from '@/components/status-bar';
import { DepotMap } from '@/components/depot-map';
import { LocaDetailPanel } from '@/components/loca-detail-panel';
import { DecisionPanel } from '@/components/decision-panel';
import { CarbonChainCard } from '@/components/carbon-chain-card';
import { MapView } from '@/components/map-view';

import { ActionLog } from '@/components/action-log';
import { BigBagSection } from '@/components/big-bag-section';
import { HeroOverlay } from '@/components/hero-overlay';
import { LocaStateProvider, useLocaState, useSelectedLoca } from '@/hooks/use-loca-state';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import type { VentilationDecision, AnomalyType, DriftPhase } from '@/lib/types';

const ANOMALY_BANNER_TEXT: Record<AnomalyType, string> = {
  temp_high: 'SICAKLIK ANOMALİSİ — MEKANİK SOĞUTMA AKTİF',
  humidity_high: 'NEM ANOMALİSİ — NEM ALICI DEVREDE',
  co2_spike: 'CO₂ SEVİYESİ KRİTİK — HAVALANDIRMA AÇILIYOR',
  ammonia_spike: 'AMONYAK SEVİYESİ KRİTİK — ACİL MÜDAHALE',
};

const PHASE_LABELS: Record<DriftPhase, string> = {
  inactive: 'Pasif',
  ramping: 'Anomali Oluşuyor',
  holding: 'Anomali Aktif',
  detected: 'Algılandı',
  acting: 'Müdahale Aktif',
  recovering: 'İyileşme',
  resolved: 'Çözüldü',
};

function Dashboard() {
  const [demoMode, setDemoMode] = useState(false);
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [currentAnomalyType, setCurrentAnomalyType] = useState<AnomalyType | null>(null);
  const [ventilationDecision, setVentilationDecision] = useState<VentilationDecision | null>(null);
  const [showVentilation, setShowVentilation] = useState(false);
  const [anomalyStartTime, setAnomalyStartTime] = useState<string | null>(null);
  const [detectedTimestamp, setDetectedTimestamp] = useState<string | null>(null);
  const [currentDriftPhase, setCurrentDriftPhase] = useState<DriftPhase>('inactive');
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentHumidity, setCurrentHumidity] = useState<number | null>(null);
  const ventPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectionToasted = useRef(false);
  const actionToasted = useRef(false);
  const recoveryToasted = useRef(false);
  const anomalyActiveRef = useRef(false);

  const { selectedLocaId } = useLocaState();
  const selectedLoca = useSelectedLoca();
  const canTrigger = !!selectedLoca && !!selectedLoca.varietyId;

  useEffect(() => {
    return () => {
      if (ventPollRef.current) clearInterval(ventPollRef.current);
    };
  }, []);

  const cleanup = useCallback(() => {
    if (ventPollRef.current) {
      clearInterval(ventPollRef.current);
      ventPollRef.current = null;
    }
    setShowVentilation(false);
    setVentilationDecision(null);
    setAnomalyActive(false);
    anomalyActiveRef.current = false;
    setCurrentAnomalyType(null);
    setAnomalyStartTime(null);
    setDetectedTimestamp(null);
    setCurrentDriftPhase('inactive');
    setCurrentTemp(null);
    setCurrentHumidity(null);
    detectionToasted.current = false;
    actionToasted.current = false;
    recoveryToasted.current = false;
  }, []);

  const handleTriggerAnomaly = useCallback(async (anomalyType: AnomalyType) => {
    if (!selectedLocaId || anomalyActive) return;

    setAnomalyActive(true);
    anomalyActiveRef.current = true;
    setCurrentAnomalyType(anomalyType);
    setAnomalyStartTime(new Date().toISOString());
    detectionToasted.current = false;
    actionToasted.current = false;
    recoveryToasted.current = false;

    try {
      const res = await fetch('/api/demo/trigger-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locaId: selectedLocaId, anomalyType }),
      });
      const data = await res.json();
      if (!data.success) {
        cleanup();
        return;
      }

      // Start polling every 3s
      const pollVent = async () => {
        try {
          const vRes = await fetch('/api/ventilation-decision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locaId: selectedLocaId }),
          });
          const vData = await vRes.json();
          setVentilationDecision(vData);

          const phase: DriftPhase = vData.driftPhase ?? 'inactive';
          setCurrentDriftPhase(phase);
          if (vData.internalConditions) {
            setCurrentTemp(vData.internalConditions.tempC);
            setCurrentHumidity(vData.internalConditions.humidity);
          }

          // Phase: detected — big warning toast
          if (phase === 'detected' && !detectionToasted.current) {
            detectionToasted.current = true;
            setDetectedTimestamp(new Date().toISOString());
            setShowVentilation(true);
            toast.warning(`⚠️ ANOMALİ TESPİT EDİLDİ — ${selectedLoca?.number ?? 'Loca'}`, {
              description: 'Otonom müdahale başlatılıyor...',
              duration: 4000,
            });
          }

          // Phase: acting — action toast
          if (phase === 'acting' && !actionToasted.current) {
            actionToasted.current = true;
            setShowVentilation(true);
            toast.success(`✓ ${vData.actionLabel ?? 'Müdahale Aktif'}`, {
              description: vData.reasoning?.slice(0, 80) ?? '',
              duration: 5000,
            });
          }

          // Phase: recovering
          if (phase === 'recovering' && !recoveryToasted.current) {
            recoveryToasted.current = true;
            toast.info(`${selectedLoca?.number ?? 'Loca'} — İyileşme devam ediyor`, {
              description: 'Değerler normale dönüyor...',
              duration: 5000,
            });
          }

          // Phase: resolved or inactive → cleanup
          if (phase === 'resolved' || phase === 'inactive') {
            if (anomalyActiveRef.current) {
              toast.success(`${selectedLoca?.number ?? 'Loca'} — Normal aralıkta`, {
                description: 'Anomali çözüldü, sistem normal çalışmaya döndü',
                duration: 6000,
              });

              fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'recovery',
                  locaId: selectedLocaId,
                  locaNumber: selectedLoca?.number ?? '',
                  description: 'Anomali çözüldü — değerler normal aralığa döndü',
                  anomalyType,
                }),
              }).catch(() => {});

              setTimeout(cleanup, 1500);
            }
          }
        } catch {
          // fail-safe
        }
      };

      // Poll every 1s for fast response
      pollVent();
      ventPollRef.current = setInterval(pollVent, 1000);
    } catch {
      cleanup();
    }
  }, [selectedLocaId, selectedLoca, anomalyActive, cleanup]);

  return (
    <div className="min-h-screen">
      <HeroOverlay />
      <StatusBar
        demoMode={demoMode}
        onDemoModeChange={setDemoMode}
        onTriggerAnomaly={handleTriggerAnomaly}
        canTrigger={canTrigger}
        anomalyActive={anomalyActive}
        currentAnomalyType={currentAnomalyType}
      />
      {/* Anomaly Overlay Banner — sticks below header */}
      {anomalyActive && showVentilation && currentAnomalyType && (
        <div
          className="sticky top-14 z-40 anomaly-banner-pulse"
          style={{
            background: 'linear-gradient(135deg, hsl(0 60% 15% / 0.95), hsl(0 50% 20% / 0.95))',
            borderBottom: '2px solid hsl(0 70% 45%)',
            boxShadow: '0 0 40px hsl(0 70% 40% / 0.5), 0 4px 20px rgba(0,0,0,0.6)',
          }}
        >
          <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-red-300 tracking-wide">
                {ANOMALY_BANNER_TEXT[currentAnomalyType]}
              </div>
              <div className="text-sm text-red-400/80 font-mono mt-0.5">
                {selectedLoca?.number ?? 'Loca'} — {PHASE_LABELS[currentDriftPhase]}
              </div>
            </div>
            <div className="flex gap-6 shrink-0">
              {currentTemp !== null && (
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-red-300">{currentTemp.toFixed(1)}°C</div>
                  <div className="text-[10px] text-red-400/60 uppercase">Sicaklik</div>
                </div>
              )}
              {currentHumidity !== null && (
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-red-300">{currentHumidity.toFixed(1)}%</div>
                  <div className="text-[10px] text-red-400/60 uppercase">Nem</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 max-w-[1800px] mx-auto">
        {/* Sol — Depo & Loca + Ventilation */}
        <section className="lg:col-span-3 space-y-4">
          <DepotMap />
          <BigBagSection />
        </section>

        {/* Orta — Loca Detay + Karar (or Ventilation overlay) */}
        <section className="lg:col-span-6 space-y-4">
          <LocaDetailPanel
            anomalyStartTime={anomalyStartTime}
            detectedTimestamp={detectedTimestamp}
            ventilationDecision={ventilationDecision}
            showVentilation={showVentilation}
          />
          <DecisionPanel onSell={() => {}} />
        </section>

        {/* Sag — Harita + Karbon + Aksiyon Log */}
        <section className="lg:col-span-3 space-y-4">
          <MapView />
          <CarbonChainCard />
          <ActionLog />
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <LocaStateProvider>
      <Dashboard />
    </LocaStateProvider>
  );
}
