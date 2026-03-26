CREATE TABLE IF NOT EXISTS fasting_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  protocol text NOT NULL DEFAULT '16:8',
  target_hours integer NOT NULL DEFAULT 16,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  broken_early boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON fasting_sessions (user_id, started_at DESC);
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fasting" ON fasting_sessions FOR ALL USING (auth.uid() = user_id);
