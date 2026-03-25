ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS privacy_mode TEXT DEFAULT 'friends' 
    CHECK (privacy_mode IN ('public', 'friends', 'private'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS share_steps BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_workouts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_sleep BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_hrv BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_readiness BOOLEAN DEFAULT true;

COMMENT ON TABLE daily_summaries IS 
  'Privacy enforced at application layer via profiles.share_* columns';
