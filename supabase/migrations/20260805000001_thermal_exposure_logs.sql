-- Thermal Exposure Logs
-- Thermoregulation tracker: cold plunge, sauna, contrast therapy
-- Research: Søberg 2021 (11 min cold/week), Laukkanen 2018 (57 min sauna/week)
-- Issue #559

create table if not exists thermal_exposure_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,

  -- Session classification
  session_type text not null check (session_type in ('cold', 'sauna', 'contrast')),
  method text not null default '',      -- e.g. cold_plunge, dry_sauna, contrast
  protocol text not null default '',    -- e.g. metabolism, cardiovascular

  -- Exposure parameters
  temp_f numeric(5,1) not null default 50,
  duration_min integer not null default 5 check (duration_min between 1 and 120),
  time_of_day text not null default 'morning'
    check (time_of_day in ('morning', 'afternoon', 'evening', 'night')),

  -- Physiological response ratings (1-5)
  alertness_after integer not null default 3 check (alertness_after between 1 and 5),
  mood_after integer not null default 3 check (mood_after between 1 and 5),
  recovery_rating integer not null default 3 check (recovery_rating between 1 and 5),
  sleep_quality_that_night integer check (sleep_quality_that_night between 1 and 5),

  notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for time-series queries per user (no unique constraint — multiple sessions/day OK)
create index if not exists thermal_exposure_logs_user_date
  on thermal_exposure_logs (user_id, date desc);

-- Row Level Security
alter table thermal_exposure_logs enable row level security;

create policy "Users can manage own thermal logs"
  on thermal_exposure_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_thermal_exposure_logs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger thermal_exposure_logs_updated_at
  before update on thermal_exposure_logs
  for each row execute function update_thermal_exposure_logs_updated_at();
