create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  imported_at timestamptz default now(),
  source_format text not null,
  filename text,
  total_records integer,
  imported_records integer,
  skipped_records integer,
  date_range_start date,
  date_range_end date,
  status text default 'completed' check (status in ('completed', 'partial', 'failed')),
  errors jsonb
);

alter table public.import_logs enable row level security;

create policy "Users manage own imports" on public.import_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
