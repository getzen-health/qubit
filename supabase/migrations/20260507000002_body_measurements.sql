create table if not exists body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date default current_date,
  neck_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  height_cm numeric,
  sex text check (sex in ('male','female')),
  body_fat_pct numeric generated always as (
    case
      when sex = 'male' and neck_cm > 0 and waist_cm > 0 and height_cm > 0
        then round((86.010 * log(waist_cm - neck_cm) - 70.041 * log(height_cm) + 36.76)::numeric, 1)
      when sex = 'female' and neck_cm > 0 and waist_cm > 0 and hips_cm > 0 and height_cm > 0
        then round((163.205 * log(waist_cm + hips_cm - neck_cm) - 97.684 * log(height_cm) - 78.387)::numeric, 1)
      else null
    end
  ) stored,
  created_at timestamptz default now()
);
alter table body_measurements enable row level security;
create policy "Users manage own measurements" on body_measurements
  for all using (auth.uid() = user_id);
