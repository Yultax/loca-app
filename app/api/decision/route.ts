import { NextRequest, NextResponse } from 'next/server';
import { depots } from '@/lib/seed/depots';
import { varieties } from '@/lib/seed/varieties';
import { predictPrice } from '@/lib/price-prediction';
import { projectedFire } from '@/lib/fire-prediction';
import { findTopBuyers } from '@/lib/route-buyers';
import { fetchTcmbRates } from '@/lib/tcmb-fetcher';
import type { SellDecision, CarbonChain } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { locaId } = await req.json();

  // Find loca
  let loca = null;
  let depot = null;
  for (const d of depots) {
    const found = d.locas.find((l) => l.id === locaId);
    if (found) {
      loca = found;
      depot = d;
      break;
    }
  }

  if (!loca || !depot) {
    return NextResponse.json({ error: 'Loca bulunamadi' }, { status: 404 });
  }

  if (!loca.varietyId) {
    return NextResponse.json({ error: 'Loca bos' }, { status: 400 });
  }

  const variety = varieties.find((v) => v.id === loca!.varietyId);
  if (!variety) {
    return NextResponse.json({ error: 'Cesit bulunamadi' }, { status: 400 });
  }

  try {
    // Direct lib calls — no self-fetch
    const [rbData, tcmb] = await Promise.all([
      findTopBuyers(locaId),
      fetchTcmbRates(),
    ]);

    if (!rbData.topBuyers?.length) {
      return NextResponse.json(
        { error: 'Alici bulunamadi' },
        { status: 400 }
      );
    }

    const bestBuyer = rbData.topBuyers[0];
    const eurTry = tcmb.rates.EUR_TRY;
    const isFallback = tcmb.source === 'hardcoded' || tcmb.source === 'cache';

    // Build carbon chain from best buyer result
    const carbonChain: CarbonChain = {
      segments: (bestBuyer.carbonChain?.segments || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => ({
          label: s.label,
          origin: s.origin,
          destination: s.destination,
          distanceKm: s.distanceKm,
          weightTon: s.weightTon,
          soilWasteTon: s.soilWasteTon,
          mode: s.mode || 'truck',
          emissionFactor: s.emissionFactor,
          co2kg: s.co2kg,
        })
      ),
      totalCO2kg: bestBuyer.carbonChain?.totalCO2kg ?? 0,
      cbamCostEUR: bestBuyer.carbonChain?.cbamCostEUR ?? 0,
      cbamCostTRY: bestBuyer.carbonChain?.cbamCostTRY ?? 0,
      fxRate: bestBuyer.carbonChain?.fxRate ?? {
        pair: 'EUR/TRY',
        rate: eurTry,
        updatedAt: new Date().toISOString(),
      },
      routeGeoJSON: bestBuyer.carbonChain?.routeGeoJSON ?? null,
    };

    // 3 scenarios: now (0), 7 days, 14 days
    const scenarioDays = [0, 7, 14];
    const isEurBuyer = bestBuyer.paymentCurrency === 'EUR';

    const scenarios = scenarioDays.map((days) => {
      const { priceTRY, multiplier } = predictPrice(loca!.varietyId!, days);
      const fireIncrease = projectedFire(loca!.fireRiskScore, days);
      const netTon = loca!.currentLoadTon * (1 - fireIncrease / 100);

      let netRevenueTRY: number;
      let netRevenueEUR: number | undefined;

      if (isEurBuyer) {
        const revenueEUR = bestBuyer.pricePerKg * netTon * 1000;
        netRevenueEUR = parseFloat((revenueEUR - carbonChain.cbamCostEUR).toFixed(2));
        netRevenueTRY = parseFloat((netRevenueEUR * eurTry).toFixed(2));
      } else {
        const revenueTRY = priceTRY * netTon * 1000;
        netRevenueTRY = parseFloat((revenueTRY - carbonChain.cbamCostTRY).toFixed(2));
      }

      const fxImpactPct = isEurBuyer && days > 0 ? parseFloat(((multiplier - 1) * 100).toFixed(2)) : 0;

      return {
        label:
          days === 0
            ? 'Şimdi Sat'
            : days === 7
              ? '7 Gün Bekle'
              : '14 Gün Bekle',
        days,
        estimatedPriceTRY: priceTRY,
        estimatedPriceEUR: isEurBuyer ? bestBuyer.pricePerKg : undefined,
        fireIncreasePct: parseFloat((fireIncrease - loca!.fireRiskScore).toFixed(1)),
        fxImpactPct,
        netRevenueTRY,
        netRevenueEUR,
        deltaVsNow: 0,
      };
    });

    // Calculate deltaVsNow
    const nowRevenue = scenarios[0].netRevenueTRY;
    for (const s of scenarios) {
      s.deltaVsNow =
        nowRevenue === 0
          ? 0
          : parseFloat((((s.netRevenueTRY - nowRevenue) / nowRevenue) * 100).toFixed(2));
    }

    // Recommendation
    const bestScenario = scenarios.reduce((a, b) =>
      b.netRevenueTRY > a.netRevenueTRY ? b : a
    );
    const recommendation = bestScenario.days === 0 ? 'sell_now' : 'hold';

    // AI Reasoning — use actual loca.fillDate (Bug 2 fix)
    const fillDate = loca.fillDate ? new Date(loca.fillDate) : new Date();
    const aiReasoning = generateReasoning(
      variety,
      loca!.fireRiskScore,
      bestBuyer,
      carbonChain,
      eurTry,
      isFallback,
      recommendation,
      scenarios,
      fillDate
    );

    const decision: SellDecision = {
      locaId,
      variety: variety.name,
      weightTon: loca.currentLoadTon,
      recommendation: recommendation as 'sell_now' | 'hold',
      scenarios,
      carbonChain,
      aiReasoning,
    };

    return NextResponse.json(decision);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Decision engine failed', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateReasoning(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variety: any,
  fireRisk: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bestBuyer: any,
  carbonChain: CarbonChain,
  eurTry: number,
  isFallback: boolean,
  recommendation: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scenarios: any[],
  fillDate: Date
): string[] {
  const bullets: string[] = [];

  // Dormancy info — use actual fillDate
  const now = new Date();
  const daysSinceFill = Math.floor(
    (now.getTime() - fillDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dormancyRemaining = Math.max(0, variety.dormancyDays - daysSinceFill);

  if (dormancyRemaining > 30) {
    bullets.push(
      `${variety.name} dormancy suresi ${variety.dormancyDays} gun, kalan ${dormancyRemaining} gun — depolamaya devam edilebilir.`
    );
  } else if (dormancyRemaining > 0) {
    bullets.push(
      `⚠ ${variety.name} dormancy bitisine ${dormancyRemaining} gun kaldi — filizlenme riski artmakta.`
    );
  } else {
    bullets.push(
      `🔴 ${variety.name} dormancy suresi doldu — acil satis onerilir.`
    );
  }

  // Fire speed
  if (fireRisk < 20) {
    bullets.push(`Fire riski dusuk (%${fireRisk}), bekleme maliyeti sinirli.`);
  } else if (fireRisk < 40) {
    bullets.push(
      `Fire riski orta seviyede (%${fireRisk}), her hafta ~%${(0.4 * 7 + 0.3 * 7).toFixed(1)} artis bekleniyor.`
    );
  } else {
    bullets.push(
      `⚠ Fire riski yuksek (%${fireRisk}), hizli degerleme kaybi — erken satis onerilir.`
    );
  }

  // Best buyer + distance + CO2
  bullets.push(
    `En iyi alici: ${bestBuyer.buyerName} (${bestBuyer.buyerCity}), ${bestBuyer.totalDistanceKm.toFixed(0)} km, ${carbonChain.totalCO2kg.toFixed(1)} kg CO₂, CBAM: ${carbonChain.cbamCostEUR.toFixed(2)} €`
  );

  // EUR/TRY note
  if (bestBuyer.paymentCurrency === 'EUR') {
    bullets.push(
      `EUR odeme — kur: ${eurTry.toFixed(2)} ₺/€${isFallback ? ' (yedek veri)' : ''}`
    );
  }

  // Recommendation summary
  if (recommendation === 'sell_now') {
    bullets.push(
      `Oneri: SIMDI SAT — bekleme fire kaybini karsilamiyor.`
    );
  } else {
    const bestHold = scenarios.find(
      (s) => s.days > 0 && s.netRevenueTRY > scenarios[0].netRevenueTRY
    );
    if (bestHold) {
      bullets.push(
        `Oneri: ${bestHold.days} GUN BEKLE — tahmini +%${bestHold.deltaVsNow.toFixed(1)} net gelir artisi.`
      );
    }
  }

  return bullets;
}
