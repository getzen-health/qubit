-- Meal logs for nutrition tracking
CREATE TABLE meal_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  foods jsonb NOT NULL DEFAULT '[]',
  total_calories numeric(7,1) DEFAULT 0,
  total_protein_g numeric(6,1) DEFAULT 0,
  total_carbs_g numeric(6,1) DEFAULT 0,
  total_fat_g numeric(6,1) DEFAULT 0,
  total_fiber_g numeric(5,1) DEFAULT 0,
  glycemic_load numeric(5,1),
  notes text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own meal logs"
  ON meal_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, date DESC);

-- Per-user nutrition settings (TDEE inputs + macro targets)
CREATE TABLE nutrition_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg numeric(5,1),
  height_cm numeric(5,1),
  age integer,
  sex text CHECK (sex IN ('male','female','other')),
  activity_level text DEFAULT 'moderate',
  goal text DEFAULT 'maintain' CHECK (goal IN ('cut','maintain','bulk')),
  body_fat_pct numeric(4,1),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE nutrition_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own nutrition settings"
  ON nutrition_settings FOR ALL
  USING (auth.uid() = user_id);
