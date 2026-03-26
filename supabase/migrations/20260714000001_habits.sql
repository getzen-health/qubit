-- Habit tracker schema (idempotent supplement to 20260710000001_habits.sql)
-- Behavioral science: Lally 2010 (66-day avg), Fogg 2020 (tiny habits + anchors), Wood & Neal 2007

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text default '✅',
  category text default 'custom',
  frequency text default 'daily' check (frequency in ('daily', 'weekdays', 'custom')),
  custom_days integer[],
  time_of_day text default 'anytime',
  anchor text,
  tiny_version text,
  target_streak integer default 66,
  xp_per_completion integer default 10,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.habits enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'habits' and policyname = 'Users manage own habits'
  ) then
    create policy "Users manage own habits" on public.habits
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  completed_at date not null default current_date,
  skipped boolean default false,
  note text,
  xp_earned integer default 10,
  created_at timestamptz default now(),
  unique(user_id, habit_id, completed_at)
);
alter table public.habit_logs enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'habit_logs' and policyname = 'Users manage own habit logs'
  ) then
    create policy "Users manage own habit logs" on public.habit_logs
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, completed_at desc);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'user_achievements' and policyname = 'Users manage own achievements'
  ) then
    create policy "Users manage own achievements" on public.user_achievements
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
