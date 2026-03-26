-- sync_queue table: tracks pending background sync jobs for third-party providers
create table if not exists sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  payload jsonb default '{}',
  created_at timestamptz default now()
);

alter table sync_queue enable row level security;

create policy "Users view own sync queue" on sync_queue
  for select using (auth.uid() = user_id);

create index if not exists idx_sync_queue_user_id on sync_queue(user_id);
create index if not exists idx_sync_queue_status on sync_queue(status);
create index if not exists idx_sync_queue_provider on sync_queue(provider);
