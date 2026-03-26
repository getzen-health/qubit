-- Add strava_activity_id to track synced Strava activities
ALTER TABLE workout_records
ADD COLUMN IF NOT EXISTS strava_activity_id BIGINT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workout_records_strava_id ON workout_records(strava_activity_id);
