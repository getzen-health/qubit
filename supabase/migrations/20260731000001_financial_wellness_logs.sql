-- Financial Wellness Logs
-- Tracks financial wellness PERCEPTIONS only — no actual financial data (balances, income, spending)
-- Based on CFPB Financial Well-Being Scale (2015) adapted 5-item version

create table if not exists financial_wellness_logs (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  date                   date not null,

  -- CFPB adapted 5-item scale (1-5 Likert: Never=1 to Always=5)
  -- Positive items scored as-is; negative items reverse-scored in application layer
  cfpb_q1                smallint not null check (cfpb_q1 between 1 and 5), -- positive
  cfpb_q2                smallint not null check (cfpb_q2 between 1 and 5), -- positive
  cfpb_q3                smallint not null check (cfpb_q3 between 1 and 5), -- negative (reverse scored)
  cfpb_q4                smallint not null check (cfpb_q4 between 1 and 5), -- negative (reverse scored)
  cfpb_q5                smallint not null check (cfpb_q5 between 1 and 5), -- negative (reverse scored)

  -- Supplemental wellness inputs
  financial_stress       smallint not null check (financial_stress between 1 and 10),
  emergency_fund_months  smallint not null default 0 check (emergency_fund_months >= 0),
  positive_money_thoughts smallint not null check (positive_money_thoughts between 1 and 10),
  financial_worry_topics text[]   not null default '{}',
  coping_techniques_used text[]   not null default '{}',

  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  unique (user_id, date)
);

-- Index for time-series queries
create index if not exists idx_financial_wellness_logs_user_date
  on financial_wellness_logs (user_id, date desc);

-- Enable Row Level Security
alter table financial_wellness_logs enable row level security;

-- Users may only access their own records
create policy "users can view own financial wellness logs"
  on financial_wellness_logs for select
  using (auth.uid() = user_id);

create policy "users can insert own financial wellness logs"
  on financial_wellness_logs for insert
  with check (auth.uid() = user_id);

create policy "users can update own financial wellness logs"
  on financial_wellness_logs for update
  using (auth.uid() = user_id);

create policy "users can delete own financial wellness logs"
  on financial_wellness_logs for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_financial_wellness_logs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_financial_wellness_logs_updated_at
  before update on financial_wellness_logs
  for each row execute function update_financial_wellness_logs_updated_at();
