-- integrations table: unified OAuth token storage for third-party fitness providers
-- Note: user_integrations already exists; this adds a complementary integrations table
-- with a metadata column for provider-specific data (e.g. Oura readiness score)
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

alter table integrations enable row level security;

create policy "Users manage own integrations" on integrations
  for all using (auth.uid() = user_id);

create index if not exists idx_integrations_user_id on integrations(user_id);
create index if not exists idx_integrations_user_provider on integrations(user_id, provider);
