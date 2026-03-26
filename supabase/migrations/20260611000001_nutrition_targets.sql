CREATE TABLE IF NOT EXISTS user_nutrition_targets (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  goal text DEFAULT 'maintain' CHECK (goal IN ('lose', 'maintain', 'gain', 'recomp')),
  activity_level text DEFAULT 'moderate' CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  calories_kcal integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  fiber_g integer,
  water_ml integer,
  auto_calculated boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own targets" ON user_nutrition_targets FOR ALL USING (auth.uid() = user_id);
