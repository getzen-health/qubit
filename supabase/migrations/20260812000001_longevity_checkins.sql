CREATE TABLE longevity_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  pillar_scores jsonb NOT NULL DEFAULT '{}',
  blueprint_items_completed jsonb NOT NULL DEFAULT '[]',
  blueprint_score integer DEFAULT 0,
  overall_score integer DEFAULT 0,
  epigenetic_age_delta numeric(4,1) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE longevity_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own longevity data" ON longevity_checkins FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_longevity_user_date ON longevity_checkins(user_id, date DESC);
