create table if not exists public.skin_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  spf_applied boolean default false,
  spf_value integer default 30,
  spf_reapplied boolean default false,
  sun_exposure_min integer default 0,
  water_ml integer default 0,
  vit_c_taken boolean default false,
  omega3_taken boolean default false,
  lycopene_taken boolean default false,
  green_tea_taken boolean default false,
  am_routine_done boolean default false,
  pm_routine_done boolean default false,
  conditions jsonb default '{}',
  skincare_products jsonb default '[]',
  uv_index numeric(4,1),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.skin_logs enable row level security;

create policy "Users manage own skin logs" on public.skin_logs
  for all using (auth.uid() = user_id);

create index on public.skin_logs(user_id, date desc);
