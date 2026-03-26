-- Energy Management Tracker: ultradian BRAC cycles, energy debt, caffeine timing
-- Research basis: Kleitman 1963, Peretz Lavie 1986, Loehr & Schwartz 2003

create table if not exists public.energy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  wake_time text not null default '07:00',
  chronotype text not null default 'intermediate',
  sleep_hours numeric(4,1) not null default 7,
  sleep_quality integer not null default 3 check (sleep_quality between 1 and 5),
  steps integer not null default 0,
  meal_quality_avg numeric(3,1) not null default 3 check (meal_quality_avg between 1 and 5),
  caffeine_mg integer not null default 0,
  caffeine_time text not null default '08:00',
  ultradian_cycles jsonb not null default '[]',
  energy_ratings jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

alter table public.energy_logs enable row level security;

create policy "Users manage own energy logs"
  on public.energy_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on public.energy_logs(user_id, date desc);

-- Auto-update updated_at
create or replace function public.update_energy_logs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_energy_logs_updated_at
  before update on public.energy_logs
  for each row execute function public.update_energy_logs_updated_at();
