-- Posture Rehabilitation: assessments and exercise logs
-- Implements Janda Upper/Lower Crossed Syndrome tracking

create table if not exists posture_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  deviations jsonb not null default '{}'::jsonb,
  pain_areas jsonb not null default '[]'::jsonb,
  ergonomic_score integer not null default 0 check (ergonomic_score between 0 and 8),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists posture_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  exercise_id text not null,
  sets_completed integer not null default 0,
  reps_completed integer,
  duration_sec integer,
  deviation_focus text,
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists posture_assessments_user_date_idx
  on posture_assessments (user_id, date desc);

create index if not exists posture_exercise_logs_user_date_idx
  on posture_exercise_logs (user_id, date desc);

-- Row Level Security
alter table posture_assessments enable row level security;
alter table posture_exercise_logs enable row level security;

create policy "posture_assessments_select" on posture_assessments
  for select using (auth.uid() = user_id);

create policy "posture_assessments_insert" on posture_assessments
  for insert with check (auth.uid() = user_id);

create policy "posture_assessments_update" on posture_assessments
  for update using (auth.uid() = user_id);

create policy "posture_assessments_delete" on posture_assessments
  for delete using (auth.uid() = user_id);

create policy "posture_exercise_logs_select" on posture_exercise_logs
  for select using (auth.uid() = user_id);

create policy "posture_exercise_logs_insert" on posture_exercise_logs
  for insert with check (auth.uid() = user_id);

create policy "posture_exercise_logs_update" on posture_exercise_logs
  for update using (auth.uid() = user_id);

create policy "posture_exercise_logs_delete" on posture_exercise_logs
  for delete using (auth.uid() = user_id);
