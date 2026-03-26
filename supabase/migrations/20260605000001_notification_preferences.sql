CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email_weekly_digest boolean DEFAULT false,
  digest_day text DEFAULT 'sunday' CHECK (digest_day IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  push_enabled boolean DEFAULT false,
  push_habits boolean DEFAULT true,
  push_water boolean DEFAULT true,
  push_sleep boolean DEFAULT true,
  email_address text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification prefs" ON user_notification_preferences FOR ALL USING (auth.uid() = user_id);
