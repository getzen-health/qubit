-- Add anthropometric and fitness profile columns to users table
-- Required for personalized HR zones, BMI, calorie estimates, and VO2max

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS height_cm       NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS weight_kg       NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS max_heart_rate  INTEGER,
  ADD COLUMN IF NOT EXISTS resting_hr      INTEGER,
  ADD COLUMN IF NOT EXISTS fitness_level   TEXT CHECK (fitness_level IN ('beginner','intermediate','advanced','elite'));

COMMENT ON COLUMN public.users.height_cm      IS 'User height in centimetres';
COMMENT ON COLUMN public.users.weight_kg      IS 'User weight in kilograms';
COMMENT ON COLUMN public.users.max_heart_rate IS 'User max heart rate (bpm); if null, estimated as 220 - age';
COMMENT ON COLUMN public.users.resting_hr     IS 'Resting heart rate (bpm) used for Karvonen HR zone formula';
COMMENT ON COLUMN public.users.fitness_level  IS 'Self-reported fitness level for personalised training recommendations';
