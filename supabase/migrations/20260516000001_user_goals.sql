create table if not exists user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  daily_steps int default 10000,
  sleep_hours numeric(4,1) default 8.0,
  water_liters numeric(4,2) default 2.5,
  target_weight_kg numeric(6,2),
  calorie_budget int default 2000,
  updated_at timestamptz default now()
);
alter table user_goals enable row level security;
create policy "Users can manage own goals" on user_goals for all using (auth.uid() = user_id);
