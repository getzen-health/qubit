-- Add ANS/allostatic load columns to existing stress_logs table
alter table public.stress_logs
  add column if not exists perceived_stress integer check (perceived_stress between 1 and 10),
  add column if not exists ans_state text check (ans_state in ('thriving', 'stressed', 'depleted')),
  add column if not exists stressors text[],
  add column if not exists stressor_intensity integer check (stressor_intensity between 1 and 10),
  add column if not exists physical_symptoms text[],
  add column if not exists coping_used text[],
  add column if not exists log_date date not null default current_date;

-- Backfill log_date from existing logged_at
update public.stress_logs set log_date = logged_at::date where logged_at is not null;

-- Unique constraint required for upsert on (user_id, log_date)
alter table public.stress_logs
  drop constraint if exists stress_logs_user_date_unique;
alter table public.stress_logs
  add constraint stress_logs_user_date_unique unique (user_id, log_date);

create index if not exists idx_stress_user_date on public.stress_logs(user_id, log_date desc);
