-- Migration: menstrual_cycles table for menstrual cycle tracking
-- Tracks menstrual cycle phases, symptoms, and predictions for users who menstruate

create table if not exists public.menstrual_cycles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  start_date      date not null,
  end_date        date,
  cycle_length    integer, -- calculated or user-provided
  flow_intensity  text, -- 'light', 'moderate', 'heavy'
  symptoms        text[] default '{}', -- ['cramps', 'mood_changes', 'energy_low', 'bloating', 'headache']
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, start_date)
);

-- Index for user + date queries
create index if not exists menstrual_cycles_user_date_idx
  on public.menstrual_cycles (user_id, start_date desc);

-- RLS
alter table public.menstrual_cycles enable row level security;

create policy "Users can read own menstrual cycles"
  on public.menstrual_cycles for select
  using (auth.uid() = user_id);

create policy "Users can insert own menstrual cycles"
  on public.menstrual_cycles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own menstrual cycles"
  on public.menstrual_cycles for update
  using (auth.uid() = user_id);

create policy "Users can delete own menstrual cycles"
  on public.menstrual_cycles for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.update_menstrual_cycles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger menstrual_cycles_updated_at
  before update on public.menstrual_cycles
  for each row execute function public.update_menstrual_cycles_updated_at();
