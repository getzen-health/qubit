create table if not exists public.metabolic_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  assessed_at date not null default current_date,
  metabolic_score integer,
  metabolic_syndrome_criteria integer,
  has_metabolic_syndrome boolean,
  insulin_resistance_proxy text,
  tg_hdl_ratio numeric,
  flexibility_score integer,
  inputs jsonb,
  created_at timestamptz default now()
);

alter table public.metabolic_assessments enable row level security;

create policy "Users manage own metabolic data" on public.metabolic_assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_metabolic_assessments_user on public.metabolic_assessments(user_id, assessed_at desc);
