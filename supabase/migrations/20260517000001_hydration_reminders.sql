create table if not exists hydration_reminder_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  enabled boolean default true,
  start_hour int default 8,
  end_hour int default 20,
  interval_hours int default 2,
  updated_at timestamptz default now()
);
alter table hydration_reminder_settings enable row level security;
create policy "Users manage own reminders" on hydration_reminder_settings for all using (auth.uid() = user_id);
