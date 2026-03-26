create table if not exists chronotype_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chronotype text not null, -- lion/bear/wolf/dolphin
  quiz_answers jsonb not null default '{}',
  workday_wake time,
  freeday_wake time,
  social_jet_lag_hours numeric(4,2),
  assessed_at timestamptz not null default now()
);

create index chronotype_user_idx on chronotype_assessments(user_id, assessed_at desc);
alter table chronotype_assessments enable row level security;
create policy "users manage own chronotype" on chronotype_assessments for all using (auth.uid() = user_id);

-- Light exposure logging
create table if not exists light_exposure_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period in ('morning', 'afternoon', 'evening')),
  duration_min integer not null default 0,
  type text not null default 'natural' check (type in ('natural', 'bright_lamp', 'blue_light_device', 'dim')),
  logged_at timestamptz not null default now()
);

alter table light_exposure_logs enable row level security;
create policy "users manage light logs" on light_exposure_logs for all using (auth.uid() = user_id);
