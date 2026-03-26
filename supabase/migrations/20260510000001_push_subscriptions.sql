create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription jsonb not null,
  created_at timestamptz default now(),
  unique(user_id)
);
alter table public.push_subscriptions enable row level security;
create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id);
