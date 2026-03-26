-- Mental Health & Wellbeing tables
-- Supports PHQ-9, GAD-7, WHO-5, PERMA, CD-RISC-10 assessments and mood logging.

CREATE TABLE mental_health_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('phq9','gad7','who5','perma','cdrisc','composite')),
  scores jsonb NOT NULL DEFAULT '{}',
  composite_score integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mental_health_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own assessments"
  ON mental_health_assessments
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_mh_assessments_user_date
  ON mental_health_assessments(user_id, date DESC);

-- ─── Mood Logs ───────────────────────────────────────────────────────────────

CREATE TABLE mood_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_at timestamptz DEFAULT now(),
  valence integer CHECK (valence BETWEEN -5 AND 5),
  arousal integer CHECK (arousal BETWEEN -5 AND 5),
  emotions text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own moods"
  ON mood_logs
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_mood_logs_user
  ON mood_logs(user_id, logged_at DESC);
