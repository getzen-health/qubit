-- VO2max Tests
-- Stores estimated VO2max results from three validated methods:
--   1. Cooper 12-minute run (Cooper 1968, JAMA)
--   2. Resting HR method (Uth et al. 2004)
--   3. 1-mile walk test (Kline et al. 1987)

create table if not exists vo2max_tests (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  date               date not null,
  method             text not null check (method in ('cooper_12min', 'resting_hr', 'one_mile_walk')),

  -- Cooper 12-min run inputs
  distance_meters    numeric,

  -- Resting HR method inputs
  resting_hr         numeric,
  max_hr             numeric,

  -- 1-mile walk test inputs
  walk_time_min      numeric,
  walk_end_hr        numeric,
  weight_lbs         numeric,
  age                smallint,
  sex                text check (sex in ('male', 'female')),

  -- Computed results
  vo2max_estimated   numeric not null,
  crf_category       text not null check (
                       crf_category in ('Very Poor', 'Poor', 'Fair', 'Good', 'Excellent', 'Superior')
                     ),
  met_capacity       numeric not null,
  percentile         smallint,
  notes              text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Efficient time-series queries per user
create index if not exists idx_vo2max_tests_user_date
  on vo2max_tests (user_id, date desc);

-- Enable Row Level Security
alter table vo2max_tests enable row level security;

create policy "users can view own vo2max tests"
  on vo2max_tests for select
  using (auth.uid() = user_id);

create policy "users can insert own vo2max tests"
  on vo2max_tests for insert
  with check (auth.uid() = user_id);

create policy "users can update own vo2max tests"
  on vo2max_tests for update
  using (auth.uid() = user_id);

create policy "users can delete own vo2max tests"
  on vo2max_tests for delete
  using (auth.uid() = user_id);
