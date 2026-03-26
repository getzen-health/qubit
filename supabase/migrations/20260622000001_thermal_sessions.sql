create table if not exists thermal_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_type text not null check (session_type in ('cold_shower', 'ice_bath', 'cold_plunge', 'cryotherapy', 'sauna_dry', 'sauna_steam', 'sauna_infrared', 'hot_bath', 'contrast')),
  duration_seconds integer not null,
  temperature_c numeric(5,1),
  difficulty integer check (difficulty between 1 and 10),
  mood_after integer check (mood_after between 1 and 10),
  notes text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index thermal_user_idx on thermal_sessions(user_id, logged_at desc);
alter table thermal_sessions enable row level security;
create policy "users manage thermal sessions" on thermal_sessions for all using (auth.uid() = user_id);
