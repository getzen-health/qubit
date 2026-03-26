create table if not exists gut_health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bristol_type integer check (bristol_type between 1 and 7),
  frequency_today integer default 1,
  symptoms jsonb default '{}', -- { bloating: 2, gas: 1, ... } severity 0-5
  fiber_intake_g numeric(6,1),
  fermented_food boolean default false,
  trigger_foods text[],
  notes text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index gut_logs_user_idx on gut_health_logs(user_id, logged_at desc);
alter table gut_health_logs enable row level security;
create policy "users manage gut logs" on gut_health_logs for all using (auth.uid() = user_id);
