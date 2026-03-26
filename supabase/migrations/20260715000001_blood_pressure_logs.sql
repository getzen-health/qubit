create table if not exists public.blood_pressure_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  measured_at timestamptz not null default now(),
  systolic integer not null check (systolic between 60 and 300),
  diastolic integer not null check (diastolic between 40 and 200),
  pulse integer check (pulse between 30 and 250),
  arm text default 'left' check (arm in ('left', 'right')),
  time_of_day text check (time_of_day in ('morning', 'midday', 'evening', 'night')),
  notes text,
  created_at timestamptz default now()
);

alter table public.blood_pressure_logs enable row level security;

create policy "Users manage own BP logs" on public.blood_pressure_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_bp_user_date on public.blood_pressure_logs(user_id, measured_at desc);
