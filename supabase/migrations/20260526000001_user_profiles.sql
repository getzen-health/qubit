CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  age integer,
  sex text CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  primary_goal text DEFAULT 'general_wellness' CHECK (primary_goal IN (
    'lose_weight', 'build_muscle', 'improve_sleep', 'reduce_stress',
    'eat_healthier', 'improve_fitness', 'manage_condition', 'general_wellness'
  )),
  health_conditions text[] DEFAULT '{}',
  dietary_preferences text[] DEFAULT '{}',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
