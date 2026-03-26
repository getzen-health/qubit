ALTER TABLE scan_history
  ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scan_history_favorites ON scan_history(user_id, is_favorite) WHERE is_favorite = true;
