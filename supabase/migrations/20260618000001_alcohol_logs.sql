create table if not exists alcohol_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drink_name text not null,
  drink_type text not null default 'other',
  abv numeric(5,2) not null,
  volume_ml numeric(7,2) not null,
  units numeric(5,2) not null,
  logged_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index alcohol_logs_user_idx on alcohol_logs(user_id, logged_at desc);
alter table alcohol_logs enable row level security;
create policy "users manage own alcohol logs" on alcohol_logs for all using (auth.uid() = user_id);
