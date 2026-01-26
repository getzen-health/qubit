-- Add unique constraints for upsert operations
-- These constraints allow the iOS and web apps to safely upsert records

-- Health records: unique on user_id, type, and start_time
-- This allows updating existing records when re-syncing
ALTER TABLE health_records
    ADD CONSTRAINT unique_health_record UNIQUE (user_id, type, start_time);

-- Sleep records: unique on user_id and start_time
-- Prevents duplicate sleep sessions
ALTER TABLE sleep_records
    ADD CONSTRAINT unique_sleep_record UNIQUE (user_id, start_time);

-- Workout records: unique on user_id and start_time
-- Prevents duplicate workout sessions
ALTER TABLE workout_records
    ADD CONSTRAINT unique_workout_record UNIQUE (user_id, start_time);

-- Heart rate samples: unique on user_id and timestamp
-- Prevents duplicate heart rate readings
ALTER TABLE heart_rate_samples
    ADD CONSTRAINT unique_hr_sample UNIQUE (user_id, timestamp);

-- Add is_read column to health_insights if it doesn't exist
-- (for tracking read/unread insights in the app)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'health_insights' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE health_insights ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;
END $$;
