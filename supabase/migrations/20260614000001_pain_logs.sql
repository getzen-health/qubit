CREATE TABLE IF NOT EXISTS pain_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body_region text NOT NULL,
  side text CHECK (side IN ('left', 'right', 'both', 'center')),
  pain_level integer NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
  pain_type text CHECK (pain_type IN ('sharp', 'aching', 'burning', 'stiffness', 'throbbing', 'other')),
  activity_modified boolean DEFAULT false,
  related_to_workout boolean DEFAULT false,
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON pain_logs(user_id, logged_at DESC);
CREATE INDEX ON pain_logs(user_id, body_region);
ALTER TABLE pain_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own pain logs" ON pain_logs FOR ALL USING (auth.uid() = user_id);
