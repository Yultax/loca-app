-- LOCA Initial Schema
-- Run this in Supabase SQL Editor

-- Varieties
create table if not exists varieties (
  id text primary key,
  name text not null,
  origin text not null check (origin in ('native', 'imported', 'doga_seed')),
  use_type text not null check (use_type in ('seed', 'table', 'crisping', 'french_fry', 'baking')),
  optimal_temp_min real not null,
  optimal_temp_max real not null,
  optimal_humidity_min real not null,
  optimal_humidity_max real not null,
  optimal_co2_min real not null,
  optimal_co2_max real not null,
  dormancy_days int not null,
  sprout_trigger_temp real not null,
  ammonia_threshold_ppm real not null,
  ethylene_threshold_ppb real not null,
  market_price_try real not null,
  prices_by_market jsonb default '{}',
  notes text default '',
  image_url text,
  created_at timestamptz default now()
);

-- Depots
create table if not exists depots (
  id text primary key,
  owner_id text not null default 'owner-doga',
  name text not null,
  city text not null,
  district text not null,
  lat real not null,
  lng real not null,
  capacity_ton real not null,
  has_chiller boolean default false,
  has_damper_control boolean default true,
  created_at timestamptz default now()
);

-- Locas
create table if not exists locas (
  id text primary key,
  number text not null,
  depot_id text references depots(id) on delete cascade,
  variety_id text references varieties(id),
  product_type text not null default 'potato',
  capacity_ton real not null,
  current_load_ton real default 0,
  status text not null default 'optimal' check (status in ('optimal', 'warning', 'critical')),
  fire_risk_score real default 0,
  fill_date date,
  position_row int not null default 0,
  position_col int not null default 0,
  position_side text not null default 'left' check (position_side in ('left', 'right')),
  residue_profile jsonb default '{"lastProducts":[],"ethyleneRemnant":0,"ammoniaRemnant":0,"cleaningDate":null}',
  created_at timestamptz default now()
);

-- Big Bags
create table if not exists big_bags (
  id text primary key,
  loca_id text references locas(id) on delete cascade,
  variety_id text references varieties(id),
  weight_kg real not null default 1000,
  soil_percent real default 3,
  harvest_date date not null,
  farmer_id text,
  contract_id text,
  position_row int default 0,
  position_col int default 0,
  position_tier int default 0,
  bruise_risk_score real default 0,
  cv_analysis jsonb default '{}',
  created_at timestamptz default now()
);

-- Sensor Readings (realtime enabled)
create table if not exists sensor_readings (
  id bigint generated always as identity primary key,
  big_bag_id text references big_bags(id) on delete cascade,
  loca_id text references locas(id) on delete cascade,
  temp_c real not null,
  humidity real not null,
  co2_ppm real not null,
  ammonia_ppm real default 0,
  ethylene_ppb real default 0,
  thermal_avg_c real,
  recorded_at timestamptz default now()
);

-- Index for realtime queries
create index if not exists idx_sensor_readings_loca on sensor_readings(loca_id, recorded_at desc);
create index if not exists idx_sensor_readings_bag on sensor_readings(big_bag_id, recorded_at desc);

-- Farmers
create table if not exists farmers (
  id text primary key,
  name text not null,
  farm_name text not null,
  city text not null,
  lat real not null,
  lng real not null,
  total_area_hectare real default 0,
  varieties text[] default '{}',
  created_at timestamptz default now()
);

-- Buyers
create table if not exists buyers (
  id text primary key,
  name text not null,
  type text not null check (type in ('processor', 'wholesale_market', 'export_broker')),
  city text not null,
  lat real not null,
  lng real not null,
  payment_currency text not null default 'TRY' check (payment_currency in ('TRY', 'EUR', 'USD')),
  accepts_varieties text[] default '{}',
  price_per_kg real not null,
  pricing_history jsonb default '[]',
  created_at timestamptz default now()
);

-- Contracts
create table if not exists contracts (
  id text primary key,
  farmer_id text references farmers(id),
  buyer_id text references buyers(id),
  variety_id text references varieties(id),
  planting_date date not null,
  estimated_harvest_date date not null,
  estimated_yield_ton real not null,
  price_per_kg real not null,
  payment_currency text not null default 'TRY',
  carbon_report_url text,
  created_at timestamptz default now()
);

-- Actions log (ventilation decisions, alerts, etc.)
create table if not exists actions (
  id bigint generated always as identity primary key,
  loca_id text references locas(id),
  action_type text not null check (action_type in ('damper_open', 'damper_close', 'chiller_on', 'chiller_off', 'alert')),
  trigger_reason text not null,
  reasoning text,
  external_conditions jsonb,
  internal_conditions jsonb,
  duration_min real,
  created_at timestamptz default now()
);

-- Enable realtime on sensor_readings (table now exists)
alter publication supabase_realtime add table sensor_readings;

-- RLS: enable for all tables, allow anon read
alter table varieties enable row level security;
alter table depots enable row level security;
alter table locas enable row level security;
alter table big_bags enable row level security;
alter table sensor_readings enable row level security;
alter table farmers enable row level security;
alter table buyers enable row level security;
alter table contracts enable row level security;
alter table actions enable row level security;

-- Anon can read all (demo mode, single user)
create policy "anon_read_varieties" on varieties for select using (true);
create policy "anon_read_depots" on depots for select using (true);
create policy "anon_read_locas" on locas for select using (true);
create policy "anon_read_big_bags" on big_bags for select using (true);
create policy "anon_read_sensor_readings" on sensor_readings for select using (true);
create policy "anon_read_farmers" on farmers for select using (true);
create policy "anon_read_buyers" on buyers for select using (true);
create policy "anon_read_contracts" on contracts for select using (true);
create policy "anon_read_actions" on actions for select using (true);

-- Service role can do everything (for seed script and simulator)
create policy "service_all_varieties" on varieties for all using (true) with check (true);
create policy "service_all_depots" on depots for all using (true) with check (true);
create policy "service_all_locas" on locas for all using (true) with check (true);
create policy "service_all_big_bags" on big_bags for all using (true) with check (true);
create policy "service_all_sensor_readings" on sensor_readings for all using (true) with check (true);
create policy "service_all_farmers" on farmers for all using (true) with check (true);
create policy "service_all_buyers" on buyers for all using (true) with check (true);
create policy "service_all_contracts" on contracts for all using (true) with check (true);
create policy "service_all_actions" on actions for all using (true) with check (true);
