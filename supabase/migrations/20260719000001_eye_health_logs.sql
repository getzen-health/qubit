create table if not exists public.eye_health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at date not null default current_date,
  screen_hours numeric,
  outdoor_minutes integer,
  breaks_taken integer,
  breaks_target integer,
  symptoms text[],
  blink_reminder_used boolean default false,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, logged_at)
);

alter table public.eye_health_logs enable row level security;

create policy "Users manage own eye logs" on public.eye_health_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
