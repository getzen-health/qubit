CREATE TABLE IF NOT EXISTS breathing_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern text NOT NULL,
  duration_seconds integer NOT NULL,
  cycles_completed integer DEFAULT 0,
  mood_before integer CHECK (mood_before BETWEEN 1 AND 10),
  mood_after integer CHECK (mood_after BETWEEN 1 AND 10),
  notes text,
  completed_at timestamptz DEFAULT now()
);
CREATE INDEX ON breathing_sessions(user_id, completed_at DESC);
ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own breathing sessions" ON breathing_sessions FOR ALL USING (auth.uid() = user_id);
