create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  metric text not null,  -- 'steps', 'calories', 'sleep_hours', 'workouts'
  target_value numeric not null,
  start_date date not null,
  end_date date not null,
  is_public boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  progress numeric default 0,
  completed boolean default false,
  joined_at timestamptz default now(),
  unique(challenge_id, user_id)
);

alter table challenges enable row level security;
alter table challenge_participants enable row level security;

create policy "Public challenges viewable by all" on challenges
  for select using (is_public = true or auth.uid() = created_by);
create policy "Users join challenges" on challenge_participants
  for all using (auth.uid() = user_id);
