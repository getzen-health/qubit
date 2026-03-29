-- Add streak tracking to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active_date DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT; -- anonymous alias shown on leaderboard

-- Leaderboard view (only opt-in users, no PII)
CREATE OR REPLACE VIEW public.streak_leaderboard AS
SELECT
  id,
  COALESCE(display_name, 'Anonymous Quarker') AS display_name,
  current_streak,
  longest_streak,
  last_active_date
FROM user_profiles
WHERE leaderboard_opt_in = true AND current_streak > 0
ORDER BY current_streak DESC, longest_streak DESC
LIMIT 100;

-- RLS: anyone can read leaderboard view, only owner can update own profile
GRANT SELECT ON public.streak_leaderboard TO anon, authenticated;
