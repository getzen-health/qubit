create table if not exists user_training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_id text not null,
  plan_name text not null,
  started_at date default current_date,
  current_week int default 1,
  status text check (status in ('active','completed','paused')) default 'active',
  created_at timestamptz default now(),
  unique(user_id, plan_id)
);
alter table user_training_plans enable row level security;
create policy "Users manage own training plans" on user_training_plans
  for all using (auth.uid() = user_id);
