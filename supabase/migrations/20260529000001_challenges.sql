CREATE TABLE IF NOT EXISTS challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  type text DEFAULT 'steps' CHECK (type IN ('steps', 'active_minutes', 'workouts', 'water')),
  target_value integer NOT NULL,
  duration_days integer DEFAULT 7,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_value integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read public challenges" ON challenges FOR SELECT USING (is_public = true);
CREATE POLICY "Users manage own challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = created_by);
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own participation" ON challenge_participants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Read all participants in public challenges" ON challenge_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM challenges c WHERE c.id = challenge_id AND c.is_public = true)
);

-- Seed a few default weekly challenges
INSERT INTO challenges (title, description, type, target_value, duration_days, is_public)
VALUES
  ('10K Steps Daily', 'Hit 10,000 steps every day this week', 'steps', 70000, 7, true),
  ('30-Minute Active Week', 'Log 210 active minutes this week', 'active_minutes', 210, 7, true),
  ('Hydration Hero', 'Drink 2L water every day for 7 days', 'water', 14000, 7, true)
ON CONFLICT DO NOTHING;
