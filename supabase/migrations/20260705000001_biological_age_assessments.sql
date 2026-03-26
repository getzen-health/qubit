create table if not exists public.biological_age_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  assessed_at date not null default current_date,
  chronological_age integer,
  biological_age numeric,
  pace_of_aging numeric,
  blue_zone_score integer,
  inputs jsonb,
  result jsonb,
  created_at timestamptz default now()
);

alter table public.biological_age_assessments enable row level security;

create policy "Users manage own bio age"
  on public.biological_age_assessments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_bioage_user_date
  on public.biological_age_assessments (user_id, assessed_at desc);
