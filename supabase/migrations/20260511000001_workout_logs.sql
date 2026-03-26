create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  duration_minutes integer not null,
  calories integer,
  notes text,
  workout_date timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.workout_logs enable row level security;
create policy "Users manage own workout logs" on public.workout_logs
  for all using (auth.uid() = user_id);
create index workout_logs_user_date on public.workout_logs(user_id, workout_date desc);
