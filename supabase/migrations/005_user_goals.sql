-- Add personal goal columns to users table
-- These replace localStorage-only goals and enable cross-device sync + AI goal awareness

ALTER TABLE users ADD COLUMN IF NOT EXISTS step_goal INTEGER DEFAULT 10000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS calorie_goal INTEGER DEFAULT 500;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sleep_goal_minutes INTEGER DEFAULT 480;
