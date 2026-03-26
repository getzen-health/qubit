create table if not exists public.dental_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  brushing_count integer default 0,
  brushing_duration_sec integer default 0,
  flossed boolean default false,
  mouthwash boolean default false,
  tongue_scraper boolean default false,
  oil_pulling boolean default false,
  water_flosser boolean default false,
  sugar_exposures integer default 0,
  fluoride_used boolean default false,
  dry_mouth boolean default false,
  acidic_beverages integer default 0,
  snacking_count integer default 0,
  sensitivity_areas jsonb default '[]',
  bleeding_gums boolean default false,
  notes text,
  last_dentist_visit date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.dental_logs enable row level security;

create policy "Users manage own dental logs" on public.dental_logs
  for all using (auth.uid() = user_id);

create index on public.dental_logs(user_id, date desc);
