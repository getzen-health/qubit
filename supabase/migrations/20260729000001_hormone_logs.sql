-- Hormone Health Logs
-- Tracks daily hormone proxy indicators for testosterone, cortisol, thyroid, and estrogen scoring
-- Sources: Leproult & Van Cauter 2011, Kumari et al. 2009, Bhasin 2010, Zimmermann 2009, Chrousos 2009

create table if not exists hormone_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,

  -- Sleep (Van Cauter testosterone proxy)
  sleep_hours numeric(4,2) not null default 7,
  sleep_quality smallint check (sleep_quality between 1 and 5),

  -- Training (Bhasin exercise-testosterone)
  resistance_training_days_week smallint not null default 0,

  -- Nutrition (testosterone co-factors)
  zinc_mg numeric(6,2) not null default 0,
  healthy_fat_servings smallint not null default 0,
  vitamin_d_iu integer not null default 0,
  adequate_calories boolean not null default true,

  -- Stress / HPA axis (Chrousos cortisol)
  stress_level smallint check (stress_level between 1 and 10),

  -- Body composition
  bmi_estimate numeric(5,2),
  body_fat_estimate numeric(5,2),

  -- Cortisol rhythm (Kumari CAR proxies)
  morning_energy smallint check (morning_energy between 1 and 10),
  afternoon_crash smallint check (afternoon_crash between 0 and 3),
  evening_alertness_9pm smallint check (evening_alertness_9pm between 1 and 10),

  -- Thyroid symptoms (Zimmermann — 8 hypothyroid indicators, each 0-3)
  thyroid_symptoms jsonb not null default '{}'::jsonb,
  iodine_rich_foods_week smallint not null default 0,

  -- Estrogen balance
  fiber_g numeric(6,2) not null default 0,
  cruciferous_servings smallint not null default 0,
  alcohol_drinks smallint not null default 0,

  -- Meta
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, date)
);

-- RLS
alter table hormone_logs enable row level security;

create policy "Users can view own hormone logs"
  on hormone_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own hormone logs"
  on hormone_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own hormone logs"
  on hormone_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own hormone logs"
  on hormone_logs for delete
  using (auth.uid() = user_id);

-- Index for efficient date-range queries
create index if not exists idx_hormone_logs_user_date_desc
  on hormone_logs (user_id, date desc);
