create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  barcode text,
  product_name text not null,
  brand text,
  score integer,
  image_url text,
  scanned_at timestamptz default now()
);
alter table public.scan_history enable row level security;
create policy "Users manage own scan history" on public.scan_history
  for all using (auth.uid() = user_id);
create index scan_history_user_date on public.scan_history(user_id, scanned_at desc);
