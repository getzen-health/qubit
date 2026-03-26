create table if not exists break_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  break_type text not null check (break_type in ('movement', 'eye_rest', 'hydration', 'stretch', 'posture_check', 'pomodoro')),
  duration_seconds integer not null default 60,
  completed boolean not null default false,
  sitting_minutes_before integer,
  logged_at timestamptz not null default now()
);

create index break_sessions_user_idx on break_sessions(user_id, logged_at desc);
alter table break_sessions enable row level security;
create policy "users manage break sessions" on break_sessions for all using (auth.uid() = user_id);
