-- Gut Health Logs
-- Tracks Bristol stool type, symptoms, microbiome proxies, and risk factors.
-- Science: Sonnenburg & Bäckhed 2016, Dahl 2023, Cryan 2019, Lewis & Heaton 1997

create table if not exists public.gut_health_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  date          date not null,

  -- Bristol Stool Form Scale (1-7); Lewis & Heaton 1997
  bristol_type          smallint not null default 4 check (bristol_type between 1 and 7),
  bowel_movement_count  smallint not null default 1 check (bowel_movement_count >= 0),

  -- Symptoms 0-3 (0=none, 1=mild, 2=moderate, 3=severe)
  bloating  smallint not null default 0 check (bloating between 0 and 3),
  gas       smallint not null default 0 check (gas between 0 and 3),
  pain      smallint not null default 0 check (pain between 0 and 3),
  nausea    smallint not null default 0 check (nausea between 0 and 3),

  -- Microbiome proxies (Dahl 2023, Sonnenburg Lab 2021)
  plant_species_count       smallint not null default 0 check (plant_species_count >= 0),
  fermented_food_servings   smallint not null default 0 check (fermented_food_servings >= 0),
  ultra_processed_servings  smallint not null default 0 check (ultra_processed_servings >= 0),
  fiber_g                   numeric(5,1) not null default 0 check (fiber_g >= 0),
  probiotic_strain          text not null default '',
  prebiotic_taken           boolean not null default false,

  -- Leaky gut risk factors
  nsaid_use         boolean not null default false,
  alcohol_drinks    smallint not null default 0 check (alcohol_drinks >= 0),
  gluten_sensitivity boolean not null default false,
  stress_level      smallint not null default 5 check (stress_level between 1 and 10),
  antibiotic_recent boolean not null default false,

  -- Other
  water_l   numeric(4,1) not null default 0 check (water_l >= 0),
  notes     text not null default '',

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  unique (user_id, date)
);

alter table public.gut_health_logs enable row level security;

create policy "Users manage own gut logs"
  on public.gut_health_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists gut_health_logs_user_date_idx
  on public.gut_health_logs (user_id, date desc);
