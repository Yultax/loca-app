import { createClient } from '@supabase/supabase-js';
import { varieties } from '../lib/seed/varieties';
import { depots } from '../lib/seed/depots';
import { farmers } from '../lib/seed/farmers';
import { buyers } from '../lib/seed/buyers';
import { contracts } from '../lib/seed/contracts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRole) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole);

async function seed() {
  console.log('Seeding varieties...');
  const { error: varErr } = await supabase.from('varieties').upsert(
    varieties.map(v => ({
      id: v.id,
      name: v.name,
      origin: v.origin,
      use_type: v.useType,
      optimal_temp_min: v.optimalTempC[0],
      optimal_temp_max: v.optimalTempC[1],
      optimal_humidity_min: v.optimalHumidity[0],
      optimal_humidity_max: v.optimalHumidity[1],
      optimal_co2_min: v.optimalCo2ppm[0],
      optimal_co2_max: v.optimalCo2ppm[1],
      dormancy_days: v.dormancyDays,
      sprout_trigger_temp: v.sproutTriggerTempC,
      ammonia_threshold_ppm: v.ammoniaThresholdPpm,
      ethylene_threshold_ppb: v.ethyleneThresholdPpb,
      market_price_try: v.marketPriceTRY,
      prices_by_market: v.pricesByMarket,
      notes: v.notes,
      image_url: v.imageUrl || null,
    }))
  );
  if (varErr) console.error('Varieties error:', varErr);
  else console.log(`  ${varieties.length} varieties inserted`);

  console.log('Seeding depots...');
  const { error: depErr } = await supabase.from('depots').upsert(
    depots.map(d => ({
      id: d.id,
      owner_id: d.ownerId,
      name: d.name,
      city: d.city,
      district: d.district,
      lat: d.coordinates[0],
      lng: d.coordinates[1],
      capacity_ton: d.capacityTon,
      has_chiller: d.hasChiller,
      has_damper_control: d.hasDamperControl,
    }))
  );
  if (depErr) console.error('Depots error:', depErr);
  else console.log(`  ${depots.length} depots inserted`);

  console.log('Seeding locas...');
  const allLocas = depots.flatMap(d => d.locas);
  const { error: locErr } = await supabase.from('locas').upsert(
    allLocas.map(l => ({
      id: l.id,
      number: l.number,
      depot_id: l.depotId,
      variety_id: l.varietyId,
      product_type: l.productType,
      capacity_ton: l.capacityTon,
      current_load_ton: l.currentLoadTon,
      status: l.status,
      fire_risk_score: l.fireRiskScore,
      fill_date: l.fillDate,
      position_row: l.position.row,
      position_col: l.position.col,
      position_side: l.position.side,
      residue_profile: l.residueProfile,
    }))
  );
  if (locErr) console.error('Locas error:', locErr);
  else console.log(`  ${allLocas.length} locas inserted`);

  console.log('Seeding big_bags...');
  const allBags = allLocas.flatMap(l => l.bigBags);
  // Insert in batches of 500 (Supabase limit)
  const BATCH = 500;
  let bagCount = 0;
  for (let i = 0; i < allBags.length; i += BATCH) {
    const batch = allBags.slice(i, i + BATCH);
    const { error: bagErr } = await supabase.from('big_bags').upsert(
      batch.map(b => ({
        id: b.id,
        loca_id: b.locaId,
        variety_id: b.variety,
        weight_kg: b.weightKg,
        soil_percent: b.soilPercent,
        harvest_date: b.harvestDate,
        farmer_id: b.farmerId,
        contract_id: b.contractId,
        position_row: b.positionInLoca.row,
        position_col: b.positionInLoca.col,
        position_tier: b.positionInLoca.tier,
        bruise_risk_score: b.bruiseRiskScore,
        cv_analysis: b.cvAnalysis,
      }))
    );
    if (bagErr) {
      console.error(`Big bags batch ${i} error:`, bagErr);
      break;
    }
    bagCount += batch.length;
  }
  console.log(`  ${bagCount} big bags inserted`);

  console.log('Seeding farmers...');
  const { error: farmErr } = await supabase.from('farmers').upsert(
    farmers.map(f => ({
      id: f.id,
      name: f.name,
      farm_name: f.farmName,
      city: f.city,
      lat: f.coordinates[0],
      lng: f.coordinates[1],
      total_area_hectare: f.totalAreaHectare,
      varieties: f.varieties,
    }))
  );
  if (farmErr) console.error('Farmers error:', farmErr);
  else console.log(`  ${farmers.length} farmers inserted`);

  console.log('Seeding buyers...');
  const { error: buyErr } = await supabase.from('buyers').upsert(
    buyers.map(b => ({
      id: b.id,
      name: b.name,
      type: b.type,
      city: b.city,
      lat: b.coordinates[0],
      lng: b.coordinates[1],
      payment_currency: b.paymentCurrency,
      accepts_varieties: b.acceptsVarieties,
      price_per_kg: b.pricePerKg,
      pricing_history: b.pricingHistory,
    }))
  );
  if (buyErr) console.error('Buyers error:', buyErr);
  else console.log(`  ${buyers.length} buyers inserted`);

  console.log('Seeding contracts...');
  const { error: conErr } = await supabase.from('contracts').upsert(
    contracts.map(c => ({
      id: c.id,
      farmer_id: c.farmerId,
      buyer_id: c.buyerId,
      variety_id: c.varietyId,
      planting_date: c.plantingDate,
      estimated_harvest_date: c.estimatedHarvestDate,
      estimated_yield_ton: c.estimatedYieldTon,
      price_per_kg: c.pricePerKg,
      payment_currency: c.paymentCurrency,
      carbon_report_url: c.carbonReportUrl || null,
    }))
  );
  if (conErr) console.error('Contracts error:', conErr);
  else console.log(`  ${contracts.length} contracts inserted`);

  console.log('\nSeed complete!');
}

seed().catch(console.error);
