-- user_medications: alternate medication tracking table for interaction checker
-- Pairs with the existing medications/medication_logs tables.
-- This table uses a simpler schema suited to the interaction checker feature.

create table if not exists public.user_medications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  medication_name text not null,
  generic_name text,
  dosage       text,
  frequency    text,
  start_date   date,
  end_date     date,
  notes        text,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.user_medications enable row level security;

create policy "Users manage own medications"
  on public.user_medications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_medications_user_active
  on public.user_medications(user_id, is_active);
