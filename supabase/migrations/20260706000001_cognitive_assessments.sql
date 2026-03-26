-- Cognitive performance assessments
-- Stores composite and per-test scores from browser-based cognitive tests.

create table if not exists public.cognitive_assessments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  assessed_at     timestamptz not null default now(),
  total_score     integer,
  reaction_time_ms integer,
  go_no_go_score  integer,
  digit_span      integer,
  time_of_day     text,
  results         jsonb,
  created_at      timestamptz default now()
);

alter table public.cognitive_assessments enable row level security;

create policy "Users manage own cognitive"
  on public.cognitive_assessments
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_cognitive_user_date
  on public.cognitive_assessments (user_id, assessed_at desc);
