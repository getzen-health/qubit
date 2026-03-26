create table if not exists longevity_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  longevity_score integer not null,
  fitness_age integer,
  vo2max numeric(5,1),
  score_breakdown jsonb not null default '{}',
  inputs jsonb not null default '{}',
  grade text,
  assessed_at timestamptz not null default now()
);

create index longevity_user_idx on longevity_assessments(user_id, assessed_at desc);
alter table longevity_assessments enable row level security;
create policy "users manage own longevity" on longevity_assessments for all using (auth.uid() = user_id);
