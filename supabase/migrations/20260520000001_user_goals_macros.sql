ALTER TABLE user_goals
  ADD COLUMN IF NOT EXISTS target_calories integer DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS target_protein_g integer DEFAULT 150,
  ADD COLUMN IF NOT EXISTS target_carbs_g integer DEFAULT 250,
  ADD COLUMN IF NOT EXISTS target_fat_g integer DEFAULT 65;
