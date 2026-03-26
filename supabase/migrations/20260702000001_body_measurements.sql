create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  measured_at date not null default current_date,
  weight_kg numeric,
  height_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  chest_cm numeric,
  neck_cm numeric,
  left_arm_cm numeric,
  right_arm_cm numeric,
  left_thigh_cm numeric,
  right_thigh_cm numeric,
  left_calf_cm numeric,
  right_calf_cm numeric,
  notes text,
  created_at timestamptz default now()
);

alter table public.body_measurements enable row level security;

create policy "Users manage own measurements" on public.body_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_body_measurements_user on public.body_measurements(user_id, measured_at desc);
