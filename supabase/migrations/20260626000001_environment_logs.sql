create table if not exists environment_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location text not null default 'indoor' check (location in ('indoor', 'outdoor', 'commute', 'work', 'gym')),
  co2_ppm integer,
  humidity_pct numeric(5,2),
  temperature_c numeric(5,2),
  voc_level text check (voc_level in ('low', 'medium', 'high')),
  pm25 numeric(6,2),
  notes text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index env_logs_user_idx on environment_logs(user_id, logged_at desc);
alter table environment_logs enable row level security;
create policy "users manage env logs" on environment_logs for all using (auth.uid() = user_id);
