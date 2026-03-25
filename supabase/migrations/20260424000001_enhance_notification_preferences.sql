-- Enhance notification preferences with additional granular controls

-- Add missing notification preference fields
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS achievement_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quiet_hours_start INTEGER DEFAULT 21 CHECK (quiet_hours_start BETWEEN 0 AND 23),
ADD COLUMN IF NOT EXISTS quiet_hours_end INTEGER DEFAULT 8 CHECK (quiet_hours_end BETWEEN 0 AND 23),
ADD COLUMN IF NOT EXISTS weekly_digest_day INTEGER DEFAULT 0 CHECK (weekly_digest_day BETWEEN 0 AND 6),
ADD COLUMN IF NOT EXISTS weekly_digest_hour INTEGER DEFAULT 7 CHECK (weekly_digest_hour BETWEEN 0 AND 23),
ADD COLUMN IF NOT EXISTS anomaly_severity_threshold TEXT DEFAULT 'medium'; -- low, medium, high

-- Ensure the trigger still works properly
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
