create table if not exists sun_exposure_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duration_min integer not null,
  uv_index numeric(4,1),
  skin_type integer check (skin_type between 1 and 6),
  body_exposure text not null default 'face_arms',
  spf integer not null default 0,
  estimated_iu integer,
  latitude numeric(8,4),
  longitude numeric(8,4),
  notes text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index sun_exposure_user_idx on sun_exposure_logs(user_id, logged_at desc);
alter table sun_exposure_logs enable row level security;
create policy "users manage sun logs" on sun_exposure_logs for all using (auth.uid() = user_id);
