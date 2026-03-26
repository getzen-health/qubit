create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exported_at timestamptz default now(),
  format text not null check (format in ('fhir', 'csv', 'pdf')),
  date_range_start date,
  date_range_end date,
  record_count integer,
  filename text
);
alter table public.export_logs enable row level security;
create policy "Users manage own exports" on public.export_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_export_logs_user on public.export_logs(user_id, exported_at desc);
