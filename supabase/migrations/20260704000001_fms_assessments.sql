create table if not exists public.fms_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  assessed_at date not null default current_date,
  scores jsonb not null,
  total_score integer not null,
  risk_level text not null,
  weak_links text[],
  asymmetries text[],
  notes text,
  created_at timestamptz default now()
);
alter table public.fms_assessments enable row level security;
create policy "Users manage own FMS" on public.fms_assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_fms_user_date on public.fms_assessments(user_id, assessed_at desc);
