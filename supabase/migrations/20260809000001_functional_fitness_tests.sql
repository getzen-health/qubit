-- Functional Fitness & Aging Biomarkers
-- Stores grip strength, gait speed, chair stand, balance, and 6-min walk tests
-- Research: Studenski 2011 (JAMA), Leong 2015 (Lancet), Bohannon 2006, EWGSOP2

create table if not exists functional_fitness_tests (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  date                     date not null,

  age                      int not null check (age between 10 and 120),
  sex                      text not null check (sex in ('male', 'female')),
  height_cm                numeric(5,1),
  weight_kg                numeric(5,1),

  -- Grip strength (kg), best of 3 squeezes
  grip_strength_kg         numeric(5,1),

  -- Gait speed — stored as computed m/s; raw distance/time preserved for audit
  gait_speed_mps           numeric(5,3),
  gait_distance_m          numeric(5,1),
  gait_time_sec            numeric(6,2),

  -- 30-second chair stand reps
  chair_stand_reps         int,

  -- Single-leg balance (seconds until touch-down)
  balance_eyes_open_sec    numeric(5,1),
  balance_eyes_closed_sec  numeric(5,1),

  -- 6-minute walk test (meters walked)
  walk_6min_meters         numeric(6,1),

  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Most recent tests first, efficient per-user queries
create index if not exists functional_fitness_tests_user_date
  on functional_fitness_tests (user_id, date desc);

-- Auto-update updated_at
create or replace function update_functional_fitness_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_functional_fitness_updated_at on functional_fitness_tests;
create trigger trg_functional_fitness_updated_at
  before update on functional_fitness_tests
  for each row execute function update_functional_fitness_updated_at();

-- Row Level Security
alter table functional_fitness_tests enable row level security;

create policy "users can read own functional fitness tests"
  on functional_fitness_tests for select
  using (auth.uid() = user_id);

create policy "users can insert own functional fitness tests"
  on functional_fitness_tests for insert
  with check (auth.uid() = user_id);

create policy "users can update own functional fitness tests"
  on functional_fitness_tests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own functional fitness tests"
  on functional_fitness_tests for delete
  using (auth.uid() = user_id);
