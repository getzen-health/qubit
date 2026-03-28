create table if not exists public.caffeine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz not null default now(),
  drink_type text not null check (drink_type in ('coffee','espresso','tea','green_tea','energy_drink','soda','supplement','other')),
  amount_ml int check (amount_ml between 1 and 2000),
  caffeine_mg int not null check (caffeine_mg between 1 and 1000),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.caffeine_logs enable row level security;
create policy "Users manage own caffeine logs" on public.caffeine_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.caffeine_logs(user_id, logged_at desc);
