-- Add performance indexes for common daily_summaries queries
-- These indexes optimize filtering by user_id, date ranges, and nullable columns

-- Index for queries filtering by user and date with stats
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_steps 
  ON daily_summaries(user_id, steps DESC) 
  WHERE steps > 0;

-- Index for recovery/strain queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_recovery 
  ON daily_summaries(user_id, recovery_score DESC) 
  WHERE recovery_score IS NOT NULL AND recovery_score > 0;

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_strain 
  ON daily_summaries(user_id, strain_score DESC) 
  WHERE strain_score IS NOT NULL AND strain_score > 0;

-- Index for HRV queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_hrv 
  ON daily_summaries(user_id, avg_hrv DESC) 
  WHERE avg_hrv IS NOT NULL AND avg_hrv > 0;

-- Index for weight/body queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_weight 
  ON daily_summaries(user_id, date DESC) 
  WHERE weight_kg IS NOT NULL;

-- Index for sleep queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_sleep 
  ON daily_summaries(user_id, sleep_duration_minutes DESC) 
  WHERE sleep_duration_minutes IS NOT NULL AND sleep_duration_minutes > 0;

-- Index for resting HR queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_rhr 
  ON daily_summaries(user_id, resting_heart_rate DESC) 
  WHERE resting_heart_rate IS NOT NULL;
