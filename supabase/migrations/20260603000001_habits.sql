CREATE TABLE IF NOT EXISTS user_habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text DEFAULT '⭐',
  category text DEFAULT 'health' CHECK (category IN ('health', 'fitness', 'nutrition', 'sleep', 'mental', 'custom')),
  target_value numeric,
  target_unit text,  -- 'glasses', 'steps', 'minutes', 'times'
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'custom')),
  reminder_time time,  -- e.g. '08:00:00'
  reminder_enabled boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id uuid REFERENCES user_habits(id) ON DELETE CASCADE NOT NULL,
  completed_date date DEFAULT CURRENT_DATE,
  value_logged numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits" ON user_habits FOR ALL USING (auth.uid() = user_id);
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own completions" ON habit_completions FOR ALL USING (auth.uid() = user_id);
