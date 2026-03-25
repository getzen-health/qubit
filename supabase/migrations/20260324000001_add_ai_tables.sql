-- AI briefings
create table if not exists briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  content text not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table briefings enable row level security;
create policy "Users see own briefings" on briefings for all using (auth.uid() = user_id);

-- Anomalies
create table if not exists anomalies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  detected_at timestamptz default now(),
  metric text not null,
  value double precision not null,
  avg_value double precision not null,
  deviation double precision not null,
  severity text check (severity in ('low','medium','high')),
  claude_explanation text,
  dismissed_at timestamptz
);
alter table anomalies enable row level security;
create policy "Users see own anomalies" on anomalies for all using (auth.uid() = user_id);

-- Chat messages
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  role text check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);
alter table chat_messages enable row level security;
create policy "Users see own messages" on chat_messages for all using (auth.uid() = user_id);

-- Predictions
create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  week_of date not null,
  recovery_forecast text,
  performance_window text,
  caution_flags text,
  raw_response jsonb,
  created_at timestamptz default now(),
  unique(user_id, week_of)
);
alter table predictions enable row level security;
create policy "Users see own predictions" on predictions for all using (auth.uid() = user_id);
