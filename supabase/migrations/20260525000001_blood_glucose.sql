CREATE TABLE IF NOT EXISTS blood_glucose_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value_mmol numeric(5,2) NOT NULL,
  value_mgdl integer GENERATED ALWAYS AS (ROUND(value_mmol * 18.018)) STORED,
  context text NOT NULL DEFAULT 'random' CHECK (context IN ('fasting', 'post_meal', 'pre_meal', 'random', 'bedtime')),
  notes text,
  logged_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_blood_glucose_user_date ON blood_glucose_entries(user_id, logged_at DESC);
ALTER TABLE blood_glucose_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own glucose" ON blood_glucose_entries FOR ALL USING (auth.uid() = user_id);
