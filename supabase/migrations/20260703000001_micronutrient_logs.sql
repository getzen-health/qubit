create table if not exists public.micronutrient_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at date not null default current_date,
  nutrient_id text not null,
  amount numeric not null,
  source text default 'manual' check (source in ('manual', 'food', 'supplement', 'food_scan')),
  food_name text,
  notes text,
  created_at timestamptz default now()
);

alter table public.micronutrient_logs enable row level security;

create policy "Users manage own nutrient logs" on public.micronutrient_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_micronutrient_user_date on public.micronutrient_logs(user_id, logged_at desc);
