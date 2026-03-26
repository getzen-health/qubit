create table if not exists public.stress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  score integer not null check (score between 1 and 10),
  notes text,
  logged_at timestamptz default now()
);
alter table public.stress_logs enable row level security;
create policy "Users manage own stress logs" on public.stress_logs
  for all using (auth.uid() = user_id);
create index stress_logs_user_date on public.stress_logs(user_id, logged_at desc);
