create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  dashboard_card_order text[] default array['health-score','steps','sleep','water','workout','mood','streaks','nutrition'],
  dashboard_hidden_cards text[] default array[]::text[],
  updated_at timestamptz default now()
);
alter table user_preferences enable row level security;
create policy "Users manage own preferences" on user_preferences for all using (auth.uid() = user_id);
