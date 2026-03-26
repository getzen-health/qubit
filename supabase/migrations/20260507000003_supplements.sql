create table if not exists supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  dose text,
  unit text default 'mg',
  taken_at timestamptz default now(),
  date date default current_date
);
alter table supplement_logs enable row level security;
create policy "Users manage own supplement logs" on supplement_logs
  for all using (auth.uid() = user_id);
create index if not exists idx_supplement_logs_user_date on supplement_logs(user_id, date);
