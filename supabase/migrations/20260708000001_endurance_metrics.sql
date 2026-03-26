-- Endurance performance metrics: VDOT (running) and FTP/power zones (cycling)
-- Gabbett (2016) weekly mileage logging for ramp-rate monitoring

create table if not exists public.endurance_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  updated_at timestamptz default now(),
  -- Running
  vdot numeric,
  best_5k_seconds integer,
  best_10k_seconds integer,
  best_hm_seconds integer,
  best_marathon_seconds integer,
  weekly_distance_km numeric,
  -- Cycling
  ftp_watts integer,
  weight_kg numeric,
  -- Shared
  vo2max_estimate numeric,
  unique (user_id)
);

alter table public.endurance_profiles enable row level security;

create policy "Users manage own endurance"
  on public.endurance_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Weekly mileage logs for ramp-rate analysis
create table if not exists public.weekly_mileage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  distance_km numeric not null,
  sport text default 'running' check (sport in ('running', 'cycling', 'swimming')),
  created_at timestamptz default now(),
  unique (user_id, week_start, sport)
);

alter table public.weekly_mileage_logs enable row level security;

create policy "Users manage own mileage"
  on public.weekly_mileage_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for efficient time-series queries
create index if not exists weekly_mileage_logs_user_week_idx
  on public.weekly_mileage_logs (user_id, week_start desc);
