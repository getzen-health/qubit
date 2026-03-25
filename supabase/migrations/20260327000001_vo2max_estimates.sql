-- Migration: vo2max_estimates table for long-term VO2max trending
-- Stores per-run Daniels vDot estimates so the running page can show
-- historical trend beyond the current session.

create table if not exists public.vo2max_estimates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  vo2max      numeric(5, 2) not null check (vo2max > 0 and vo2max < 100),
  source      text not null default 'daniels_vdot', -- formula used
  workout_id  uuid references public.workout_records(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date)
);

-- Compound index for user + date range queries
create index if not exists vo2max_estimates_user_date_idx
  on public.vo2max_estimates (user_id, date desc);

-- RLS
alter table public.vo2max_estimates enable row level security;

create policy "Users can read own vo2max estimates"
  on public.vo2max_estimates for select
  using (auth.uid() = user_id);

create policy "Users can insert own vo2max estimates"
  on public.vo2max_estimates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vo2max estimates"
  on public.vo2max_estimates for update
  using (auth.uid() = user_id);

create policy "Users can delete own vo2max estimates"
  on public.vo2max_estimates for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.update_vo2max_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vo2max_updated_at
  before update on public.vo2max_estimates
  for each row execute function public.update_vo2max_updated_at();
