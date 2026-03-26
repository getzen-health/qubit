-- Migration: stress_logs table for stress and cortisol tracking
-- Stores manual stress logs (1-10) and HRV-derived stress proxies
-- HRV algorithm: low HRV → high stress (inverse relationship)

create table if not exists public.stress_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_at   timestamptz not null,
  stress_level integer not null check (stress_level >= 1 and stress_level <= 10),
  source      text not null default 'manual', -- 'manual' or 'hrv_derived'
  hrv_input   numeric(5, 2), -- raw HRV value if source is 'hrv_derived'
  notes       text,
  context_tags text[] default '{}', -- ['work', 'exercise', 'sleep', 'illness', 'caffeine']
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for user + date range queries
create index if not exists stress_logs_user_logged_idx
  on public.stress_logs (user_id, logged_at desc);

-- RLS
alter table public.stress_logs enable row level security;

create policy "Users can read own stress logs"
  on public.stress_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own stress logs"
  on public.stress_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stress logs"
  on public.stress_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own stress logs"
  on public.stress_logs for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.update_stress_logs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger stress_logs_updated_at
  before update on public.stress_logs
  for each row execute function public.update_stress_logs_updated_at();

-- Function to derive stress from HRV
-- Lower HRV = higher stress (inverse relationship)
-- Assumes HRV range of 20-200ms
create or replace function public.hrv_to_stress_level(hrv numeric)
returns integer as $$
declare
  stress_level integer;
begin
  -- Scale HRV (20-200) to stress (10-1)
  -- hrv=20 -> stress=10 (very high stress)
  -- hrv=200 -> stress=1 (low stress)
  stress_level := greatest(1, least(10, 
    round((200 - hrv) / 18)::integer
  ));
  return stress_level;
end;
$$ language plpgsql immutable;
