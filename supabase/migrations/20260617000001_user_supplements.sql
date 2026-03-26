create table if not exists user_supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplement_name text not null,
  dosage text not null default '',
  timing_slots text[] not null default '{}',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_supplements_user_idx on user_supplements(user_id);

alter table user_supplements enable row level security;
create policy "users manage own supplements" on user_supplements for all using (auth.uid() = user_id);
