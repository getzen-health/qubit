CREATE TABLE IF NOT EXISTS workout_prescriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  intensity text NOT NULL CHECK (intensity IN ('rest', 'easy', 'moderate', 'hard', 'peak')),
  recommended_workout_type text,
  rationale text NOT NULL,
  hrv_score numeric,
  sleep_quality numeric,
  readiness_score numeric,
  acwr numeric,
  followed boolean,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON workout_prescriptions(user_id, date DESC);
ALTER TABLE workout_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own prescriptions" ON workout_prescriptions FOR ALL USING (auth.uid() = user_id);
