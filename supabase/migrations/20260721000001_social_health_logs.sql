-- Social Health Logs — UCLA-3 Loneliness Screener & connection tracking
-- Migration: 20260721000001_social_health_logs.sql

create table if not exists public.social_health_logs (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade not null,
  date                  date not null,

  -- UCLA Loneliness Scale v3 (Russell, 1996) — each scored 1 (Never) to 4 (Always)
  ucla3_q1              integer not null default 1 check (ucla3_q1 between 1 and 4),
  ucla3_q2              integer not null default 1 check (ucla3_q2 between 1 and 4),
  ucla3_q3              integer not null default 1 check (ucla3_q3 between 1 and 4),

  -- Interaction counts
  in_person_interactions integer not null default 0,
  digital_interactions   integer not null default 0,
  shared_meals           integer not null default 0,
  meaningful_convos      integer not null default 0,
  group_activities       integer not null default 0,

  -- Quality rating (1.0 – 5.0 average depth of connections)
  connection_depth      numeric(3,1) not null default 3.0 check (connection_depth between 1 and 5),

  volunteering_minutes  integer not null default 0,
  notes                 text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (user_id, date)
);

-- Row Level Security
alter table public.social_health_logs enable row level security;

create policy "Users manage own social logs"
  on public.social_health_logs
  for all
  using (auth.uid() = user_id);

-- Index for efficient time-series queries
create index if not exists social_health_logs_user_date_idx
  on public.social_health_logs (user_id, date desc);
