CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT '7-Day Meal Plan',
  diet_type text NOT NULL DEFAULT 'omnivore',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_plan_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name text NOT NULL,
  description text,
  calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own plan items" ON meal_plan_items FOR ALL
  USING (EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = plan_id AND mp.user_id = auth.uid()));
