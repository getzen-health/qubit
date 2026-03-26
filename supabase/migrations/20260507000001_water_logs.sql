create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount_ml int not null check (amount_ml > 0 and amount_ml <= 2000),
  logged_at timestamptz default now(),
  date date default current_date
);
alter table water_logs enable row level security;
create policy "Users manage own water logs" on water_logs
  for all using (auth.uid() = user_id);
create index if not exists idx_water_logs_user_date on water_logs(user_id, date);
