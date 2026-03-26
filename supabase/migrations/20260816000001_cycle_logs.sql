-- Women's health: menstrual cycle logs and settings
-- Migration: 20260816000001_cycle_logs

CREATE TABLE cycle_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  period_started boolean DEFAULT false,
  period_ended boolean DEFAULT false,
  -- 0=none 1=spotting 2=light 3=medium 4=heavy
  flow_level integer CHECK (flow_level BETWEEN 0 AND 4),
  -- BBT: Barron 1988 — rise of ~0.2°C confirms ovulation
  bbt_celsius numeric(4,2),
  cervical_mucus text CHECK (cervical_mucus IN ('dry','sticky','creamy','watery','egg_white')),
  -- {symptom_name: severity 1–5}
  symptoms jsonb DEFAULT '{}',
  mood integer CHECK (mood BETWEEN 1 AND 5),
  energy integer CHECK (energy BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE cycle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cycle logs"
  ON cycle_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_cycle_logs_user_date
  ON cycle_logs(user_id, date DESC);

-- User preferences for cycle tracking
CREATE TABLE cycle_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_cycle_length integer DEFAULT 28,
  avg_period_length integer DEFAULT 5,
  last_period_start date,
  -- health = general monitoring | pregnancy = trying to conceive | avoid = contraception
  tracking_goal text DEFAULT 'health'
    CHECK (tracking_goal IN ('health','pregnancy','avoid')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cycle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cycle settings"
  ON cycle_settings FOR ALL
  USING (auth.uid() = user_id);
