-- Sleep Optimizer Settings
-- Stores per-user chronotype assessment results and personalized sleep goals.
-- Reuses existing sleep_records table (or sleep_logs if present) for raw nightly data.

CREATE TABLE IF NOT EXISTS sleep_optimizer_settings (
  user_id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chronotype            text        NOT NULL DEFAULT 'intermediate'
                                    CHECK (chronotype IN (
                                      'definite_morning','moderate_morning','intermediate',
                                      'moderate_evening','definite_evening'
                                    )),
  meq_score             integer     CHECK (meq_score BETWEEN 0 AND 25),
  meq_answers           jsonb,                        -- raw question→score map
  target_wake_time      time        NOT NULL DEFAULT '07:00',
  target_bed_time       time        NOT NULL DEFAULT '23:00',
  sleep_goal_hours      numeric(3,1) NOT NULL DEFAULT 8.0
                                    CHECK (sleep_goal_hours BETWEEN 4 AND 12),
  caffeine_sensitivity  text        NOT NULL DEFAULT 'normal'
                                    CHECK (caffeine_sensitivity IN ('low','normal','high')),
  weekday_wake_time     time,
  weekend_wake_time     time,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sleep_optimizer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sleep optimizer settings"
  ON sleep_optimizer_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_sleep_optimizer_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sleep_optimizer_settings_updated_at
  BEFORE UPDATE ON sleep_optimizer_settings
  FOR EACH ROW EXECUTE FUNCTION update_sleep_optimizer_settings_updated_at();
