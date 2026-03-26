-- Migration: medications and medication_logs tables for medication tracking
-- Enables users to track medications/supplements with dosage, frequency, and adherence

create table if not exists public.medications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  dosage      numeric(10, 2) not null,
  unit        text not null, -- mg, ml, IU, etc.
  frequency   text not null, -- 'once_daily', 'twice_daily', 'three_times_daily', 'as_needed', etc.
  time_of_day text[] not null default '{}', -- ['morning', 'afternoon', 'evening', 'night']
  start_date  date not null,
  end_date    date, -- null means ongoing
  notes       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for user + active status
create index if not exists medications_user_active_idx
  on public.medications (user_id, active desc);

-- Medication logs track adherence
create table if not exists public.medication_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  taken_at      timestamptz not null,
  skipped       boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for user + date range queries
create index if not exists medication_logs_user_taken_idx
  on public.medication_logs (user_id, taken_at desc);

-- RLS for medications
alter table public.medications enable row level security;

create policy "Users can read own medications"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "Users can insert own medications"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medications"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "Users can delete own medications"
  on public.medications for delete
  using (auth.uid() = user_id);

-- RLS for medication_logs
alter table public.medication_logs enable row level security;

create policy "Users can read own medication logs"
  on public.medication_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own medication logs"
  on public.medication_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medication logs"
  on public.medication_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own medication logs"
  on public.medication_logs for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.update_medications_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger medications_updated_at
  before update on public.medications
  for each row execute function public.update_medications_updated_at();

create trigger medication_logs_updated_at
  before update on public.medication_logs
  for each row execute function public.update_medications_updated_at();
