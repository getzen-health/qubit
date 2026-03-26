-- Hydration Science Tracker v2
-- Armstrong 1-8 urine color scale, sweat rate, electrolyte tracking
-- Issue #556

create table if not exists hydration_v2_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,

  -- Fluid intake
  water_ml integer not null default 0,
  beverages jsonb not null default '[]',

  -- Urine assessment (Armstrong 1994 scale 1-8)
  urine_color integer not null default 1 check (urine_color between 1 and 8),
  urine_frequency integer not null default 0,

  -- Sweat rate test (Montain & Coyle 1992)
  pre_exercise_weight_kg numeric(5,2),
  post_exercise_weight_kg numeric(5,2),
  exercise_fluid_ml integer,
  exercise_duration_min integer,

  -- Electrolytes (Shirreffs 2003)
  sodium_mg integer not null default 0,
  potassium_mg integer not null default 0,
  magnesium_mg integer not null default 0,
  electrolyte_drink boolean not null default false,

  -- Exercise context
  exercise_minutes integer not null default 0,
  exercise_intensity text not null default 'none'
    check (exercise_intensity in ('none', 'light', 'moderate', 'vigorous')),

  -- Environment
  ambient_temp_f numeric(5,1) not null default 72,
  altitude_ft integer not null default 0,

  -- Life stage
  is_pregnant boolean not null default false,
  is_breastfeeding boolean not null default false,

  -- Body metrics
  weight_kg numeric(5,2),
  caffeine_drinks integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, date)
);

-- Indexes for common queries
create index if not exists hydration_v2_logs_user_date
  on hydration_v2_logs (user_id, date desc);

-- Row Level Security
alter table hydration_v2_logs enable row level security;

create policy "Users can manage own hydration logs"
  on hydration_v2_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_hydration_v2_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger hydration_v2_updated_at
  before update on hydration_v2_logs
  for each row execute function update_hydration_v2_updated_at();
