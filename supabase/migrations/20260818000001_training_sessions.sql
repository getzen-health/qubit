CREATE TABLE training_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  sport text NOT NULL,
  duration_min integer NOT NULL,
  rpe integer CHECK (rpe BETWEEN 1 AND 10),
  session_load integer,
  workout_type text DEFAULT 'moderate',
  heart_rate_avg integer,
  heart_rate_max integer,
  distance_km numeric(8,2),
  elevation_m integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own training" ON training_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_training_user_date ON training_sessions(user_id, date DESC);
