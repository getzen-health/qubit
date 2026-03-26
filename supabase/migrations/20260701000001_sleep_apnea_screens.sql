create table if not exists public.sleep_apnea_screens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  screened_at date not null default current_date,
  stopbang_score integer not null,
  ess_score integer,
  stopbang_risk text not null,
  ess_category text,
  answers jsonb,
  created_at timestamptz default now()
);

alter table public.sleep_apnea_screens enable row level security;

create policy "Users manage own sleep screens" on public.sleep_apnea_screens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
