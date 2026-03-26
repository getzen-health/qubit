-- Sleep Environment Logs
-- Tracks nightly sleep environment conditions and correlates with sleep quality
-- Research basis: Okamoto-Mizuno 2012, Halperin 2014, Basner 2011, Walker 2017

create table if not exists sleep_environment_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,

  -- Temperature
  room_temp_f numeric(5,1) not null default 68,
  use_celsius boolean not null default false,

  -- Darkness
  blackout_curtains boolean not null default false,
  eye_mask boolean not null default false,
  no_electronics_light boolean not null default false,

  -- Noise
  noise_level integer not null default 3 check (noise_level between 0 and 10),
  white_noise_used boolean not null default false,
  earplugs_used boolean not null default false,

  -- Pre-sleep routine
  no_screens_30min boolean not null default false,
  last_meal_hours_before numeric(4,1) not null default 2,
  wind_down_activities text[] not null default '{}',
  consistent_bedtime boolean not null default false,
  screen_time_before_bed_min integer not null default 60 check (screen_time_before_bed_min >= 0),

  -- Comfort
  mattress_age_years numeric(4,1) not null default 5,
  pillow_comfortable boolean not null default true,

  -- Next morning outcomes
  sleep_onset_min integer not null default 20 check (sleep_onset_min >= 0),
  perceived_sleep_quality integer not null default 3 check (perceived_sleep_quality between 1 and 5),

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, date)
);

-- Row Level Security
alter table sleep_environment_logs enable row level security;

create policy "Users can manage their own sleep environment logs"
  on sleep_environment_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast per-user date lookups
create index if not exists sleep_environment_logs_user_date_idx
  on sleep_environment_logs(user_id, date desc);

-- Auto-update updated_at
create or replace function update_sleep_environment_logs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sleep_environment_logs_updated_at
  before update on sleep_environment_logs
  for each row execute function update_sleep_environment_logs_updated_at();
