create table if not exists food_diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name text not null,
  calories int,
  protein_g numeric(6,2),
  carbs_g numeric(6,2),
  fat_g numeric(6,2),
  fiber_g numeric(6,2),
  serving_size text,
  logged_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table food_diary_entries enable row level security;
create policy "Users can manage own food diary" on food_diary_entries for all using (auth.uid() = user_id);
create index on food_diary_entries(user_id, logged_at desc);
