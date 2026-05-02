import { depots } from '@/lib/seed/depots';
import { buyers } from '@/lib/seed/buyers';
import { farmers } from '@/lib/seed/farmers';
import { calculateCarbonChain } from '@/lib/carbon-chain-calc';

export interface TopBuyerResult {
  locaId: string;
  varietyId: string;
  currentLoadTon: number;
  avgSoilPercent: number;
  topBuyers: Array<{
    buyerId: string;
    buyerName: string;
    buyerCity: string;
    buyerType: string;
    paymentCurrency: string;
    pricePerKg: number;
    totalDistanceKm: number;
    totalCO2kg: number;
    compositeScore: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    carbonChain: any;
  }>;
}

export async function findTopBuyers(locaId: string): Promise<TopBuyerResult> {
  // Find loca across all depots
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
    throw new Error('Loca bulunamadi');
  }

  if (!loca.varietyId) {
    throw new Error('Loca bos — cesit yok');
  }

  const matchingBuyers = buyers.filter((b) =>
    b.acceptsVarieties.includes(loca!.varietyId!)
  );

  if (matchingBuyers.length === 0) {
    throw new Error('Uygun alici yok');
  }

  const avgSoilPercent =
    loca.bigBags.length > 0
      ? loca.bigBags.reduce((s, b) => s + b.soilPercent, 0) / loca.bigBags.length
      : 3;

  const farmerId = loca.bigBags[0]?.farmerId;
  const farmer = farmerId ? farmers.find((f) => f.id === farmerId) : null;

  const buyerResults = await Promise.all(
    matchingBuyers.map(async (buyer) => {
      try {
        const segments = [];

        if (farmer) {
          segments.push({
            label: `${farmer.farmName} → ${depot!.name}`,
            origin: { name: farmer.farmName, coords: farmer.coordinates },
            destination: { name: depot!.name, coords: depot!.coordinates },
            weightTon: loca!.currentLoadTon,
            soilPercent: avgSoilPercent,
            mode: 'truck' as const,
          });
        }

        segments.push({
          label: `${depot!.name} → ${buyer.name}`,
          origin: { name: depot!.name, coords: depot!.coordinates },
          destination: { name: buyer.name, coords: buyer.coordinates },
          weightTon: loca!.currentLoadTon,
          soilPercent: avgSoilPercent,
          mode: 'truck' as const,
        });

        const carbonData = await calculateCarbonChain(segments);

        return {
          buyer,
          carbonChain: carbonData,
          totalDistanceKm: carbonData.segments?.reduce(
            (s: number, seg: { distanceKm: number }) => s + seg.distanceKm,
            0
          ) ?? 0,
          totalCO2kg: carbonData.totalCO2kg ?? 0,
        };
      } catch (e) {
        console.warn(`Carbon calc failed for buyer ${buyer.id}`, e);
        return {
          buyer,
          carbonChain: null,
          totalDistanceKm: 0,
          totalCO2kg: 0,
        };
      }
    })
  );

  const validResults = buyerResults.filter((r) => r.carbonChain);

  if (validResults.length === 0) {
    throw new Error('Karbon hesaplama basarisiz');
  }

  const maxPrice = Math.max(...validResults.map((r) => r.buyer.pricePerKg));
  const minPrice = Math.min(...validResults.map((r) => r.buyer.pricePerKg));
  const priceRange = maxPrice - minPrice || 1;

  const maxDist = Math.max(...validResults.map((r) => r.totalDistanceKm));
  const minDist = Math.min(...validResults.map((r) => r.totalDistanceKm));
  const distRange = maxDist - minDist || 1;

  const maxCO2 = Math.max(...validResults.map((r) => r.totalCO2kg));
  const minCO2 = Math.min(...validResults.map((r) => r.totalCO2kg));
  const co2Range = maxCO2 - minCO2 || 1;

  const scored = validResults
    .map((r) => {
      const priceNorm = (r.buyer.pricePerKg - minPrice) / priceRange;
      const distNorm = (r.totalDistanceKm - minDist) / distRange;
      const co2Norm = (r.totalCO2kg - minCO2) / co2Range;
      const score = 0.5 * priceNorm + 0.3 * (1 - distNorm) + 0.2 * (1 - co2Norm);

      return {
        buyerId: r.buyer.id,
        buyerName: r.buyer.name,
        buyerCity: r.buyer.city,
        buyerType: r.buyer.type,
        paymentCurrency: r.buyer.paymentCurrency,
        pricePerKg: r.buyer.pricePerKg,
        totalDistanceKm: parseFloat(r.totalDistanceKm.toFixed(1)),
        totalCO2kg: parseFloat(r.totalCO2kg.toFixed(2)),
        compositeScore: parseFloat(score.toFixed(4)),
        carbonChain: r.carbonChain,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5);

  return {
    locaId,
    varietyId: loca.varietyId,
    currentLoadTon: loca.currentLoadTon,
    avgSoilPercent: parseFloat(avgSoilPercent.toFixed(1)),
    topBuyers: scored,
  };
}
