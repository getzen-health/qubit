-- Add missing profile columns that multiple pages already query.
-- Centralises all user-facing profile data on the `users` row so pages need
-- only one table join, while `user_profiles` continues to hold onboarding data.

-- ─── users table additions ────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS full_name         TEXT,
  ADD COLUMN IF NOT EXISTS age               INTEGER CHECK (age IS NULL OR (age BETWEEN 1 AND 120)),
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE,
  ADD COLUMN IF NOT EXISTS biological_sex    TEXT CHECK (biological_sex IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS fitness_goal      TEXT DEFAULT 'general_wellness'
    CHECK (fitness_goal IN (
      'lose_weight','build_muscle','improve_sleep','reduce_stress',
      'eat_healthier','improve_fitness','manage_condition','general_wellness'
    ));

COMMENT ON COLUMN public.users.full_name      IS 'User display / full name; falls back to display_name';
COMMENT ON COLUMN public.users.age            IS 'Age in years; used for HR zones, VO2max norms, benchmarks';
COMMENT ON COLUMN public.users.date_of_birth  IS 'Date of birth; used to compute age dynamically for zones, fitness-age pages';
COMMENT ON COLUMN public.users.biological_sex IS 'Biological sex for health calculations (NIAAA alcohol, VO2max norms, etc.)';
COMMENT ON COLUMN public.users.fitness_goal   IS 'Primary fitness goal; drives AI insight tone and dashboard cards';

-- ─── user_profiles table additions ───────────────────────────────────────────
-- Pages like fitness-age, zones, workouts query date_of_birth from user_profiles.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE,
  ADD COLUMN IF NOT EXISTS biological_sex    TEXT CHECK (biological_sex IN ('male','female','other'));

COMMENT ON COLUMN public.user_profiles.date_of_birth  IS 'Date of birth; used to compute chronological age when age column is not set';
COMMENT ON COLUMN public.user_profiles.biological_sex IS 'Biological sex (mirrors users.biological_sex for onboarding flow)';
