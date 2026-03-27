-- Add is_favorited column to health_insights for save/star feature
ALTER TABLE health_insights ADD COLUMN IF NOT EXISTS is_favorited BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_insights_user_favorited ON health_insights(user_id, is_favorited) WHERE is_favorited = TRUE;
