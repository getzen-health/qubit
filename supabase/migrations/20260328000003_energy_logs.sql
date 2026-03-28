create table if not exists public.energy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  energy_level int not null check (energy_level between 1 and 5),
  notes text,
  created_at timestamptz default now()
);
alter table public.energy_logs enable row level security;
create policy "Users manage own energy logs" on public.energy_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.energy_logs(user_id, logged_at desc);
