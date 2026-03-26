create table if not exists public.injury_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  body_region text not null,
  pain_type text not null,
  intensity integer not null check (intensity between 0 and 10),
  onset_type text not null,
  onset_date date,
  aggravating_factors text[],
  relieving_factors text[],
  recovery_status text default 'active' check (recovery_status in ('active', 'improving', 'resolved', 'recurring')),
  notes text,
  logged_at date not null default current_date,
  created_at timestamptz default now()
);

alter table public.injury_logs enable row level security;

create policy "Users manage own injuries" on public.injury_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_injury_user_date on public.injury_logs(user_id, logged_at desc);
