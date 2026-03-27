-- Body Battery / Readiness Score
-- Stores daily computed readiness scores and their sub-components

create table if not exists body_battery_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,

  -- Overall
  score integer not null check (score between 0 and 100),
  category text not null check (category in ('peak','high','moderate','low','rest')),
  training_recommendation text not null,
  limiting_factor text,

  -- Sub-scores (stored for trend analysis)
  sleep_score numeric(5,2),
  cardiac_score numeric(5,2),
  training_balance_score numeric(5,2),
  nutrition_score numeric(5,2),
  mental_score numeric(5,2),
  recovery_score numeric(5,2),
  environment_score numeric(5,2),

  -- Raw inputs (for recalculation)
  inputs jsonb default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (user_id, date)
);

alter table body_battery_scores enable row level security;

create policy "Users can manage their own body battery scores"
  on body_battery_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index body_battery_scores_user_date_idx
  on body_battery_scores (user_id, date desc);
