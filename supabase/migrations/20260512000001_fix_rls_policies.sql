-- Add RLS to tables that were created without it

-- users
alter table if exists public.users enable row level security;
create policy if not exists "Users manage own users" on public.users
  for all using (auth.uid() = id);

-- user_ai_settings
alter table if exists public.user_ai_settings enable row level security;
create policy if not exists "Users manage own user_ai_settings" on public.user_ai_settings
  for all using (auth.uid() = user_id);

-- user_devices
alter table if exists public.user_devices enable row level security;
create policy if not exists "Users manage own user_devices" on public.user_devices
  for all using (auth.uid() = user_id);

-- meals
alter table if exists public.meals enable row level security;
create policy if not exists "Users manage own meals" on public.meals
  for all using (auth.uid() = user_id);

-- meal_items
alter table if exists public.meal_items enable row level security;
create policy if not exists "Users manage own meal_items" on public.meal_items
  for all using (auth.uid() = user_id);

-- daily_nutrition
alter table if exists public.daily_nutrition enable row level security;
create policy if not exists "Users manage own daily_nutrition" on public.daily_nutrition
  for all using (auth.uid() = user_id);

-- audit_logs
alter table if exists public.audit_logs enable row level security;
create policy if not exists "Users manage own audit_logs" on public.audit_logs
  for all using (auth.uid() = user_id);

-- security_events
alter table if exists public.security_events enable row level security;
create policy if not exists "Users manage own security_events" on public.security_events
  for all using (auth.uid() = user_id);

-- user_sessions
alter table if exists public.user_sessions enable row level security;
create policy if not exists "Users manage own user_sessions" on public.user_sessions
  for all using (auth.uid() = user_id);

-- daily_checkins
alter table if exists public.daily_checkins enable row level security;
create policy if not exists "Users manage own daily_checkins" on public.daily_checkins
  for all using (auth.uid() = user_id);

-- habits
alter table if exists public.habits enable row level security;
create policy if not exists "Users manage own habits" on public.habits
  for all using (auth.uid() = user_id);

-- habit_completions
alter table if exists public.habit_completions enable row level security;
create policy if not exists "Users manage own habit_completions" on public.habit_completions
  for all using (auth.uid() = user_id);

-- user_achievements
alter table if exists public.user_achievements enable row level security;
create policy if not exists "Users manage own user_achievements" on public.user_achievements
  for all using (auth.uid() = user_id);

-- strength_sessions
alter table if exists public.strength_sessions enable row level security;
create policy if not exists "Users manage own strength_sessions" on public.strength_sessions
  for all using (auth.uid() = user_id);

-- strength_sets
alter table if exists public.strength_sets enable row level security;
create policy if not exists "Users manage own strength_sets" on public.strength_sets
  for all using (auth.uid() = user_id);

-- product_scans
alter table if exists public.product_scans enable row level security;
create policy if not exists "Users manage own product_scans" on public.product_scans
  for all using (auth.uid() = user_id);

-- product_favorites
alter table if exists public.product_favorites enable row level security;
create policy if not exists "Users manage own product_favorites" on public.product_favorites
  for all using (auth.uid() = user_id);

-- user_preferences
alter table if exists public.user_preferences enable row level security;
create policy if not exists "Users manage own user_preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

-- ai_usage
alter table if exists public.ai_usage enable row level security;
create policy if not exists "Users manage own ai_usage" on public.ai_usage
  for all using (auth.uid() = user_id);

-- push_tokens
alter table if exists public.push_tokens enable row level security;
create policy if not exists "Users manage own push_tokens" on public.push_tokens
  for all using (auth.uid() = user_id);

-- friendships
alter table if exists public.friendships enable row level security;
create policy if not exists "Users manage own friendships" on public.friendships
  for all using (auth.uid() = user_id);

-- challenges
alter table if exists public.challenges enable row level security;
create policy if not exists "Users manage own challenges" on public.challenges
  for all using (auth.uid() = user_id);

-- challenge_participants
alter table if exists public.challenge_participants enable row level security;
create policy if not exists "Users manage own challenge_participants" on public.challenge_participants
  for all using (auth.uid() = user_id);

-- medications
alter table if exists public.medications enable row level security;
create policy if not exists "Users manage own medications" on public.medications
  for all using (auth.uid() = user_id);

-- medication_logs
alter table if exists public.medication_logs enable row level security;
create policy if not exists "Users manage own medication_logs" on public.medication_logs
  for all using (auth.uid() = user_id);

-- missing_products
alter table if exists public.missing_products enable row level security;
create policy if not exists "Users manage own missing_products" on public.missing_products
  for all using (auth.uid() = user_id);

-- supplements
alter table if exists public.supplements enable row level security;
create policy if not exists "Users manage own supplements" on public.supplements
  for all using (auth.uid() = user_id);

-- supplement_logs
alter table if exists public.supplement_logs enable row level security;
create policy if not exists "Users manage own supplement_logs" on public.supplement_logs
  for all using (auth.uid() = user_id);

-- streak_events
alter table if exists public.streak_events enable row level security;
create policy if not exists "Users manage own streak_events" on public.streak_events
  for all using (auth.uid() = user_id);

-- health_annotations
alter table if exists public.health_annotations enable row level security;
create policy if not exists "Users manage own health_annotations" on public.health_annotations
  for all using (auth.uid() = user_id);

-- user_integrations
alter table if exists public.user_integrations enable row level security;
create policy if not exists "Users manage own user_integrations" on public.user_integrations
  for all using (auth.uid() = user_id);

-- user_badges
alter table if exists public.user_badges enable row level security;
create policy if not exists "Users manage own user_badges" on public.user_badges
  for all using (auth.uid() = user_id);

-- badge_progress
alter table if exists public.badge_progress enable row level security;
create policy if not exists "Users manage own badge_progress" on public.badge_progress
  for all using (auth.uid() = user_id);
