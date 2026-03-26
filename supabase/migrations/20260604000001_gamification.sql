CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS user_xp_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,  -- 'food_scan', 'habit_complete', 'steps_goal', 'journal_entry', etc.
  xp_earned integer NOT NULL,
  earned_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_scans integer DEFAULT 0,
  total_habits_completed integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
ALTER TABLE user_xp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own xp" ON user_xp_log FOR ALL USING (auth.uid() = user_id);
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stats" ON user_stats FOR ALL USING (auth.uid() = user_id);
