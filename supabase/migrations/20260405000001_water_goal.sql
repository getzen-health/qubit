-- Add water_goal_ml column to user_nutrition_settings
ALTER TABLE user_nutrition_settings 
ADD COLUMN IF NOT EXISTS water_goal_ml INTEGER DEFAULT 2500;

-- Add index for performance if table is large
CREATE INDEX IF NOT EXISTS idx_user_nutrition_settings_user_id 
ON user_nutrition_settings(user_id);
