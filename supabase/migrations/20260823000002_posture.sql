-- Posture & Ergonomics Tracker
-- Sit/stand intervals, ergonomic checklist results, pain log

create table if not exists posture_intervals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  mode text not null check (mode in ('sitting','standing','walking','unknown')),
  duration_minutes numeric(6,2) generated always as (
    extract(epoch from (end_time - start_time)) / 60
  ) stored,
  source text default 'manual',   -- 'manual', 'apple_health', 'wearable'
  created_at timestamptz default now()
);

create table if not exists posture_checklist_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  completed_at timestamptz default now(),
  results jsonb not null default '[]',   -- array of {id, passed}
  score integer,
  notes text
);

create table if not exists pain_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  region text not null,
  intensity integer not null check (intensity between 1 and 5),
  time_of_day text check (time_of_day in ('morning','afternoon','evening')),
  notes text,
  created_at timestamptz default now()
);

alter table posture_intervals enable row level security;
alter table posture_checklist_results enable row level security;
alter table pain_entries enable row level security;

create policy "Users manage own posture intervals"
  on posture_intervals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own checklist results"
  on posture_checklist_results for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own pain entries"
  on pain_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index posture_intervals_user_date_idx on posture_intervals (user_id, date desc);
create index pain_entries_user_date_idx on pain_entries (user_id, date desc);
