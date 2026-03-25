-- Add onboarding_completed flag to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add hrv_target to users table (default 50ms, recommended baseline)
ALTER TABLE users ADD COLUMN IF NOT EXISTS hrv_target INTEGER DEFAULT 50;
