CREATE TABLE IF NOT EXISTS meal_recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  prep_time_min integer,
  tags text[] DEFAULT '{}',
  ingredients text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_slot text NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid REFERENCES meal_recipes(id),
  custom_meal_name text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start, day_of_week, meal_slot)
);

CREATE INDEX ON meal_plans(user_id, week_start);
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own meal plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);
ALTER TABLE meal_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public recipes readable by all" ON meal_recipes FOR SELECT USING (is_public = true);

-- Seed 15 healthy recipes
INSERT INTO meal_recipes (name, description, calories, protein_g, carbs_g, fat_g, prep_time_min, tags, ingredients) VALUES
  ('Greek Yogurt Parfait', 'High-protein breakfast with berries', 320, 22, 38, 6, 5, ARRAY['breakfast','high-protein','vegetarian'], 'Greek yogurt, granola, mixed berries, honey'),
  ('Overnight Oats', 'Fiber-rich overnight breakfast', 380, 14, 58, 9, 5, ARRAY['breakfast','high-fiber','vegetarian'], 'Rolled oats, almond milk, chia seeds, banana'),
  ('Scrambled Eggs & Avocado', 'Protein & healthy fats breakfast', 420, 24, 12, 30, 10, ARRAY['breakfast','keto','gluten-free'], '3 eggs, avocado, cherry tomatoes, olive oil'),
  ('Smoothie Bowl', 'Nutrient-dense antioxidant bowl', 340, 12, 55, 8, 5, ARRAY['breakfast','vegan','gluten-free'], 'Frozen acai, banana, spinach, almond milk, toppings'),
  ('Grilled Chicken Salad', 'Lean protein lunch bowl', 380, 42, 18, 14, 15, ARRAY['lunch','high-protein','gluten-free'], 'Chicken breast, mixed greens, cucumber, olive oil, lemon'),
  ('Quinoa Buddha Bowl', 'Complete protein plant-based bowl', 420, 18, 52, 14, 20, ARRAY['lunch','vegan','high-fiber'], 'Quinoa, chickpeas, roasted sweet potato, tahini'),
  ('Turkey & Avocado Wrap', 'Balanced macro lunch wrap', 450, 35, 38, 16, 10, ARRAY['lunch','high-protein'], 'Turkey breast, whole wheat wrap, avocado, spinach, mustard'),
  ('Tuna Nicoise Salad', 'Mediterranean omega-3 lunch', 360, 38, 14, 16, 10, ARRAY['lunch','high-protein','gluten-free'], 'Canned tuna, eggs, green beans, olives, dijon dressing'),
  ('Salmon with Roasted Veg', 'Omega-3 rich dinner', 480, 45, 22, 20, 25, ARRAY['dinner','high-protein','gluten-free'], 'Salmon fillet, broccoli, sweet potato, olive oil, lemon'),
  ('Chicken Stir-Fry', 'High-protein Asian dinner', 440, 48, 28, 12, 20, ARRAY['dinner','high-protein','gluten-free'], 'Chicken breast, bok choy, peppers, soy sauce, ginger, rice'),
  ('Lentil Dal', 'Plant-protein fiber-rich dinner', 380, 22, 58, 6, 30, ARRAY['dinner','vegan','high-fiber'], 'Red lentils, tomatoes, spinach, cumin, turmeric, brown rice'),
  ('Turkey Meatballs & Zucchini', 'Low-carb high-protein dinner', 420, 52, 12, 18, 25, ARRAY['dinner','high-protein','low-carb'], 'Turkey mince, zucchini noodles, marinara sauce, parmesan'),
  ('Protein Smoothie', 'Post-workout recovery snack', 280, 30, 28, 6, 3, ARRAY['snack','high-protein'], 'Whey protein, banana, almond milk, peanut butter'),
  ('Apple & Almond Butter', 'Fiber + healthy fat snack', 180, 4, 22, 10, 2, ARRAY['snack','vegan','gluten-free'], 'Apple, almond butter'),
  ('Cottage Cheese & Berries', 'Casein protein nighttime snack', 160, 18, 14, 3, 2, ARRAY['snack','high-protein','vegetarian'], 'Cottage cheese, strawberries, flaxseeds');
