create table if not exists public.immune_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  sleep_hours numeric(4,1) default 0,
  vit_c_mg numeric(8,2) default 0,
  vit_d_iu numeric(8,2) default 0,
  zinc_mg numeric(8,2) default 0,
  selenium_mcg numeric(8,2) default 0,
  stress_level integer default 5,
  exercise_minutes integer default 0,
  exercise_intensity text default 'none',
  fiber_g numeric(6,2) default 0,
  probiotic_taken boolean default false,
  symptoms jsonb default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.immune_logs enable row level security;

create policy "Users manage own immune logs" on public.immune_logs
  for all using (auth.uid() = user_id);

create index on public.immune_logs(user_id, date desc);
