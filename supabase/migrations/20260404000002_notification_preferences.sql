CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morning_briefing BOOLEAN DEFAULT true,
  goal_reminders BOOLEAN DEFAULT true,
  anomaly_alerts BOOLEAN DEFAULT true,
  streak_milestones BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  hrv_alerts BOOLEAN DEFAULT true,
  sleep_alerts BOOLEAN DEFAULT true,
  activity_reminders BOOLEAN DEFAULT true,
  briefing_hour INTEGER DEFAULT 7 CHECK (briefing_hour BETWEEN 0 AND 23),
  hrv_threshold_percent INTEGER DEFAULT 20 CHECK (hrv_threshold_percent BETWEEN 5 AND 50),
  rhr_threshold_bpm INTEGER DEFAULT 10 CHECK (rhr_threshold_bpm BETWEEN 3 AND 20),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification_preferences"
ON notification_preferences FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
