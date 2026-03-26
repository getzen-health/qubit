create table if not exists health_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  metric_type text, -- steps, weight, sleep_duration_minutes, etc. (null = manual)
  target_value numeric,
  current_value numeric default 0,
  unit text default '',
  goal_type text not null default 'target' check (goal_type in ('target', 'daily', 'weekly', 'streak')),
  deadline date,
  why text, -- implementation intention
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'abandoned')),
  streak_current integer default 0,
  streak_best integer default 0,
  progress_pct numeric(5,2) default 0,
  emoji text default '🎯',
  color text default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index health_goals_user_idx on health_goals(user_id, status);

create table if not exists goal_check_ins (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references health_goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value numeric,
  note text,
  checked_in_at timestamptz not null default now()
);

create index goal_check_ins_goal_idx on goal_check_ins(goal_id, checked_in_at desc);

alter table health_goals enable row level security;
alter table goal_check_ins enable row level security;
create policy "users manage own goals" on health_goals for all using (auth.uid() = user_id);
create policy "users manage own check ins" on goal_check_ins for all using (auth.uid() = user_id);
