create table if not exists public.workout_hr_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at date not null default current_date,
  workout_type text,
  duration_min integer not null,
  avg_hr integer,
  max_hr integer,
  dominant_zone integer check (dominant_zone between 1 and 5),
  calories integer,
  notes text,
  created_at timestamptz default now()
);
alter table public.workout_hr_logs enable row level security;
create policy "Users manage own HR logs" on public.workout_hr_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_hr_logs_user_date on public.workout_hr_logs(user_id, logged_at desc);

-- Store HR zone profile per user
create table if not exists public.hr_zone_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  age integer,
  resting_hr integer,
  max_hr integer,
  formula_used text default 'tanaka',
  updated_at timestamptz default now()
);
alter table public.hr_zone_profiles enable row level security;
create policy "Users manage own HR profile" on public.hr_zone_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
