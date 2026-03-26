create table if not exists user_social_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  share_steps boolean default false,
  share_workouts boolean default false,
  share_weight boolean default false,
  share_sleep boolean default false,
  profile_visibility text check (profile_visibility in ('private','friends','public')) default 'private',
  updated_at timestamptz default now()
);
alter table user_social_settings enable row level security;
create policy "Users manage own social settings" on user_social_settings
  for all using (auth.uid() = user_id);

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete cascade,
  addressee_id uuid references auth.users(id) on delete cascade,
  status text check (status in ('pending','accepted','blocked')) default 'pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);
alter table friendships enable row level security;
create policy "Users see own friendships" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users manage own friend requests" on friendships
  for insert with check (auth.uid() = requester_id);
create policy "Users respond to friend requests" on friendships
  for update using (auth.uid() = addressee_id);
