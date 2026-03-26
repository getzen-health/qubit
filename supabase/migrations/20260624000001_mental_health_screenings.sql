create table if not exists mental_health_screenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  screener_type text not null check (screener_type in ('phq9', 'gad7', 'pss4')),
  answers jsonb not null default '{}',
  total_score integer not null,
  severity_label text not null,
  screened_at timestamptz not null default now()
);

create index mh_screenings_user_idx on mental_health_screenings(user_id, screened_at desc);
alter table mental_health_screenings enable row level security;
create policy "users manage own screenings" on mental_health_screenings for all using (auth.uid() = user_id);
