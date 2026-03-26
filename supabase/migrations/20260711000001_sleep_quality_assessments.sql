create table if not exists public.sleep_quality_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  assessed_at date not null default current_date,
  psqi_global_score integer,
  psqi_answers jsonb,
  psqi_components jsonb,
  sleep_efficiency_pct numeric,
  created_at timestamptz default now()
);

alter table public.sleep_quality_assessments enable row level security;

create policy "Users manage own sleep assessments"
  on public.sleep_quality_assessments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
