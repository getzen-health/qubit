ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS glucose_low_threshold_mgdl NUMERIC DEFAULT 70,
  ADD COLUMN IF NOT EXISTS glucose_high_threshold_mgdl NUMERIC DEFAULT 180,
  ADD COLUMN IF NOT EXISTS glucose_alerts_enabled BOOLEAN DEFAULT true;
