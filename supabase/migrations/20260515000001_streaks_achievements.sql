create table if not exists user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  streak_type text not null, -- 'daily_log', 'steps', 'water', 'workout'
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  updated_at timestamptz default now(),
  unique(user_id, streak_type)
);
alter table user_streaks enable row level security;
create policy "Users can manage own streaks" on user_streaks for all using (auth.uid() = user_id);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);
alter table user_achievements enable row level security;
create policy "Users can manage own achievements" on user_achievements for all using (auth.uid() = user_id);
