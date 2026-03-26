create table if not exists public.inflammation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,

  -- Diet: anti-inflammatory inputs
  omega3_servings integer not null default 0,
  vegetables_servings integer not null default 0,
  berries_servings integer not null default 0,
  turmeric_used boolean not null default false,
  ginger_used boolean not null default false,
  green_tea_cups integer not null default 0,
  fiber_g numeric(5,1) not null default 0,
  sugar_drinks integer not null default 0,
  processed_meat integer not null default 0,
  trans_fat_items integer not null default 0,

  -- Omega-6:3 ratio inputs
  cooking_oil_servings integer not null default 0,
  processed_snacks integer not null default 0,
  grain_fed_meat integer not null default 0,
  fatty_fish_servings integer not null default 0,
  omega3_supplement boolean not null default false,
  flax_chia_servings integer not null default 0,
  walnuts_servings integer not null default 0,

  -- Lifestyle
  sleep_hours numeric(4,1) not null default 7,
  stress_level integer not null default 5 check (stress_level between 1 and 10),
  exercise_minutes_week integer not null default 0,

  -- Body composition
  waist_cm numeric(5,1),
  biological_sex text check (biological_sex in ('male', 'female')),

  -- Smoking
  smoking_status text not null default 'never' check (smoking_status in ('never', 'former', 'current')),

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, date)
);

alter table public.inflammation_logs enable row level security;

create policy "Users manage own inflammation logs"
  on public.inflammation_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_inflammation_logs_user_date
  on public.inflammation_logs (user_id, date desc);
