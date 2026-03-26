create table if not exists user_allergens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  allergen text not null,
  severity text check (severity in ('mild','moderate','severe')) default 'moderate',
  created_at timestamptz default now(),
  unique(user_id, allergen)
);
alter table user_allergens enable row level security;
create policy "Users manage own allergens" on user_allergens
  for all using (auth.uid() = user_id);
