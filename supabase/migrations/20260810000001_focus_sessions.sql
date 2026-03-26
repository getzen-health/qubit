-- Deep Work / Focus Sessions tracker (Newport 2016, Csikszentmihalyi 1990)
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time text NOT NULL,          -- HH:MM
  end_time text NOT NULL,            -- HH:MM
  duration_min integer NOT NULL CHECK (duration_min > 0),
  task_type text NOT NULL CHECK (task_type IN ('writing','coding','analysis','learning','creative','planning','reading','other')),
  task_description text,
  mode text NOT NULL CHECK (mode IN ('classic','extended','deep','custom')),
  quality_rating integer NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  flow_state boolean NOT NULL DEFAULT false,
  flow_depth integer CHECK (flow_depth BETWEEN 1 AND 5),
  distractions jsonb NOT NULL DEFAULT '[]',
  energy_level integer NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own focus sessions"
  ON focus_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_focus_sessions_user_date
  ON focus_sessions (user_id, date DESC);

CREATE INDEX idx_focus_sessions_user_created
  ON focus_sessions (user_id, created_at DESC);
