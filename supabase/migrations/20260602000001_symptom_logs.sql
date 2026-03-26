CREATE TABLE IF NOT EXISTS symptom_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_at timestamptz DEFAULT now(),
  log_date date DEFAULT CURRENT_DATE,
  body_region text,  -- 'head', 'neck', 'chest', 'back', 'abdomen', 'arms', 'legs', 'joints', 'general'
  symptom_type text NOT NULL,  -- 'pain', 'fatigue', 'nausea', 'dizziness', 'shortness_of_breath', 'numbness', 'other'
  intensity integer CHECK (intensity BETWEEN 1 AND 10) NOT NULL,
  pain_quality text,  -- 'sharp', 'dull', 'aching', 'burning', 'throbbing', 'cramping', 'pressure'
  triggers text[] DEFAULT '{}',  -- ['stress', 'food', 'poor_sleep', 'exercise', 'weather', 'posture', 'menstrual']
  duration_minutes integer,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own symptom logs" ON symptom_logs FOR ALL USING (auth.uid() = user_id);

-- Index for fast date-range queries
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON symptom_logs(user_id, log_date DESC);
