create table if not exists public.noise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  decibel_level int check (decibel_level between 0 and 200),
  duration_minutes int check (duration_minutes > 0),
  environment text check (environment in ('concert','workplace','traffic','home','gym','other')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.noise_logs enable row level security;

create policy "Users manage own noise logs" on public.noise_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index on public.noise_logs(user_id, logged_at desc);
