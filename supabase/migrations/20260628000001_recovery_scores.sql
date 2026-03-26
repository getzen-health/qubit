create table if not exists public.recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at date not null default current_date,
  hrv_ms numeric,
  resting_hr integer,
  sleep_hours numeric,
  sleep_quality integer check (sleep_quality between 1 and 10),
  soreness integer check (soreness between 1 and 10),
  mood integer check (mood between 1 and 10),
  acute_load numeric,
  chronic_load numeric,
  recovery_score integer,
  acwr numeric,
  created_at timestamptz default now(),
  unique (user_id, logged_at)
);

alter table public.recovery_logs enable row level security;

create policy "Users manage own recovery" on public.recovery_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_recovery_user_date on public.recovery_logs(user_id, logged_at desc);
