CREATE TABLE IF NOT EXISTS body_composition (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recorded_at timestamptz DEFAULT now(),
  weight_kg numeric(5,2),
  height_cm numeric(5,1),
  body_fat_pct numeric(4,1),
  muscle_mass_kg numeric(5,2),
  bone_mass_kg numeric(4,2),
  hydration_pct numeric(4,1),
  visceral_fat_level integer,
  bmi numeric(4,1),
  bmr_kcal integer,
  lean_body_mass_kg numeric(5,2),
  notes text,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON body_composition(user_id, recorded_at DESC);
ALTER TABLE body_composition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own body composition" ON body_composition FOR ALL USING (auth.uid() = user_id);
