create table if not exists public.toxin_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,

  -- Plastics & endocrine disruptors
  heated_plastic_containers integer not null default 0,
  receipt_handling integer not null default 0,
  canned_food_servings integer not null default 0,
  plastic_bottles integer not null default 0,

  -- Heavy metals
  high_mercury_fish integer not null default 0,
  medium_mercury_fish integer not null default 0,
  tap_water_concern boolean not null default false,
  old_paint_exposure boolean not null default false,

  -- Pesticides
  dirty_dozen_servings integer not null default 0,
  conventional_produce_servings integer not null default 0,
  organic_produce_servings integer not null default 0,

  -- VOCs & indoor air
  cleaning_products_used integer not null default 0,
  air_fresheners_used boolean not null default false,
  new_furniture_offgassing boolean not null default false,
  dry_cleaned_items integer not null default 0,

  -- Detox practices
  cruciferous_veg_servings integer not null default 0,
  fiber_g numeric(6,1) not null default 0,
  sauna_minutes integer not null default 0,
  water_l numeric(4,1) not null default 0,

  -- Air quality (optional)
  aqi integer,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, date)
);

alter table public.toxin_logs enable row level security;

create policy "Users manage own toxin logs" on public.toxin_logs
  for all using (auth.uid() = user_id);

create index on public.toxin_logs(user_id, date desc);
