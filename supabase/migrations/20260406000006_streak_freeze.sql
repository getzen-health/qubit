-- Add streak freeze support to user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS streak_freezes_available INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS streak_freeze_used_date DATE;

-- Track streak events (grace periods, freezes, breaks, restores)
CREATE TABLE IF NOT EXISTS streak_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL, -- "steps", "sleep", "workout", "scan"
  event_type TEXT NOT NULL,  -- "extended", "frozen", "broken", "restored"
  streak_count INTEGER,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE streak_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own streak_events" ON streak_events
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Index for fast lookups by user and date
CREATE INDEX IF NOT EXISTS streak_events_user_date_idx ON streak_events(user_id, event_date DESC);
