-- Circadian Rhythm Optimizer tables

CREATE TABLE IF NOT EXISTS light_exposure_logs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE        NOT NULL,
  morning_lux     INTEGER,
  afternoon_lux   INTEGER,
  evening_lux     INTEGER,
  blue_light_glasses BOOLEAN  DEFAULT false,
  outdoor_minutes INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS circadian_assessments (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                 DATE        NOT NULL,
  meq_score            INTEGER     CHECK (meq_score BETWEEN 0 AND 25),
  chronotype           TEXT        CHECK (chronotype IN ('extreme_early','moderate_early','intermediate','moderate_late','extreme_late')),
  dlmo_estimate        TEXT,
  social_jet_lag       NUMERIC(4,2),
  meal_alignment_score INTEGER     CHECK (meal_alignment_score BETWEEN 0 AND 100),
  overall_score        INTEGER     CHECK (overall_score BETWEEN 0 AND 100),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_light_exposure_logs_user_date
  ON light_exposure_logs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_circadian_assessments_user_date
  ON circadian_assessments(user_id, date DESC);

ALTER TABLE light_exposure_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE circadian_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "light_exposure_logs_user_policy"
  ON light_exposure_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "circadian_assessments_user_policy"
  ON circadian_assessments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
