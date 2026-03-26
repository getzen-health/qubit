-- Breathing & Respiratory Health Logs
-- Tracks daily breathing assessments and guided exercise sessions

create table if not exists breathing_logs (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  date                  date not null,
  resting_breathing_rate integer not null check (resting_breathing_rate between 4 and 60),
  breathing_pattern     text not null check (breathing_pattern in ('nasal', 'mouth', 'mixed')),
  breathing_type        text not null check (breathing_type in ('chest', 'diaphragmatic', 'mixed')),
  mrc_scale             integer not null default 0 check (mrc_scale between 0 and 4),
  symptoms              text[] not null default '{}',
  exercises_completed   jsonb not null default '[]',
  peak_flow_measured    integer check (peak_flow_measured is null or peak_flow_measured > 0),
  height_cm             integer check (height_cm is null or (height_cm between 100 and 250)),
  age                   integer check (age is null or (age between 10 and 120)),
  sex                   text check (sex is null or sex in ('male', 'female')),
  notes                 text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, date)
);

-- Index for fast user+date range queries
create index if not exists breathing_logs_user_date_idx
  on breathing_logs (user_id, date desc);

-- Updated_at trigger
create or replace function update_breathing_logs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger breathing_logs_updated_at
  before update on breathing_logs
  for each row execute function update_breathing_logs_updated_at();

-- Row Level Security
alter table breathing_logs enable row level security;

create policy "Users can read own breathing logs"
  on breathing_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own breathing logs"
  on breathing_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own breathing logs"
  on breathing_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own breathing logs"
  on breathing_logs for delete
  using (auth.uid() = user_id);
