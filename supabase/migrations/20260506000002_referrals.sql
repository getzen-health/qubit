create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references auth.users(id) on delete cascade,
  referred_email text not null,
  referred_user_id uuid references auth.users(id),
  status text check (status in ('pending','completed')) default 'pending',
  created_at timestamptz default now(),
  completed_at timestamptz,
  unique(referrer_id, referred_email)
);
alter table referrals enable row level security;
create policy "Users see own referrals" on referrals
  for select using (auth.uid() = referrer_id);
create policy "Users create referrals" on referrals
  for insert with check (auth.uid() = referrer_id);
