-- Social features: friend connections, weekly challenges, participation

-- Friend connections
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own friendships" ON friendships FOR ALL
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Weekly challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric TEXT NOT NULL, -- 'steps','calories','sleep_hours','hrv'
  target_value NUMERIC NOT NULL,
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Creators manage own challenges" ON challenges FOR ALL USING (creator_id = auth.uid());

-- Challenge participation
CREATE TABLE IF NOT EXISTS challenge_participants (
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_value NUMERIC DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see own data" ON challenge_participants FOR ALL USING (user_id = auth.uid());

CREATE INDEX challenges_dates_idx ON challenges(starts_at, ends_at);
CREATE INDEX friendships_addressee_idx ON friendships(addressee_id, status);
