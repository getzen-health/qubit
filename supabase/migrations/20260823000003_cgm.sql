-- CGM Integration: Dexcom & Freestyle Libre glucose tracking
-- Issue #485

-- ── CGM connections (OAuth tokens per user per provider) ──────────────────

create table if not exists cgm_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      text not null,           -- 'dexcom' | 'libre'
  access_token  text not null,           -- encrypted via vault or app-level encryption
  refresh_token text,
  token_expires_at timestamptz,
  dexcom_user_id text,                   -- Dexcom sub from token introspection
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  last_synced_at timestamptz,
  sync_status   text default 'pending',  -- 'pending' | 'syncing' | 'ok' | 'error'
  sync_error    text,
  unique(user_id, provider)
);

alter table cgm_connections enable row level security;

create policy "Users can manage their own CGM connections"
  on cgm_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── CGM readings ─────────────────────────────────────────────────────────

create table if not exists cgm_readings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      text not null,           -- 'dexcom' | 'libre' | 'manual'
  recorded_at   timestamptz not null,    -- original device timestamp
  glucose_mgdl  integer not null,        -- always stored as mg/dL
  trend         text,                    -- 'rising_rapidly' | 'rising' | 'flat' | 'falling' | 'falling_rapidly' | 'unknown'
  trend_rate    numeric(6,2),            -- mg/dL per minute
  meal_context  text,                    -- 'before_meal' | 'after_meal' | null
  notes         text,
  created_at    timestamptz default now(),
  unique(user_id, provider, recorded_at)
);

alter table cgm_readings enable row level security;

create policy "Users can view their own CGM readings"
  on cgm_readings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own CGM readings"
  on cgm_readings for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own CGM readings"
  on cgm_readings for delete
  using (auth.uid() = user_id);

-- Time-series index for efficient range queries
create index if not exists cgm_readings_user_time
  on cgm_readings(user_id, recorded_at desc);

-- ── Time-in-range view ────────────────────────────────────────────────────
-- Standard ADA ranges: <70 low, 70-180 in-range, >180 high

create or replace view cgm_time_in_range as
  select
    user_id,
    date_trunc('day', recorded_at at time zone 'utc') as day,
    count(*) as total_readings,
    round(100.0 * count(*) filter (where glucose_mgdl between 70 and 180) / count(*), 1) as tir_pct,
    round(100.0 * count(*) filter (where glucose_mgdl < 70) / count(*), 1) as low_pct,
    round(100.0 * count(*) filter (where glucose_mgdl > 180) / count(*), 1) as high_pct,
    round(avg(glucose_mgdl)::numeric, 1) as avg_glucose,
    min(glucose_mgdl) as min_glucose,
    max(glucose_mgdl) as max_glucose
  from cgm_readings
  group by user_id, day;

-- Grant view access (RLS on underlying table handles security)
grant select on cgm_time_in_range to authenticated;
