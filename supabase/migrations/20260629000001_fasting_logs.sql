create table if not exists public.fasting_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  protocol_id text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  target_hours integer not null,
  actual_hours numeric,
  completed boolean default false,
  notes text,
  created_at timestamptz default now()
);

alter table public.fasting_logs enable row level security;

create policy "Users manage own fasts" on public.fasting_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_fasting_user_date on public.fasting_logs(user_id, start_time desc);
