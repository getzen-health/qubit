CREATE TABLE IF NOT EXISTS cycle_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date,
  cycle_length integer DEFAULT 28,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period_start)
);

CREATE TABLE IF NOT EXISTS cycle_day_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  flow_intensity text CHECK (flow_intensity IN ('spotting', 'light', 'medium', 'heavy', 'none')),
  symptoms text[] DEFAULT '{}',  -- ['cramps', 'headache', 'bloating', 'fatigue', 'mood_swings', 'breast_tenderness']
  mood text,  -- 'great', 'good', 'neutral', 'low', 'bad'
  energy_level integer CHECK (energy_level BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE cycle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cycle logs" ON cycle_logs FOR ALL USING (auth.uid() = user_id);
ALTER TABLE cycle_day_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cycle day logs" ON cycle_day_logs FOR ALL USING (auth.uid() = user_id);
