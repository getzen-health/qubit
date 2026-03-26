CREATE TABLE IF NOT EXISTS water_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_ml integer NOT NULL,
  logged_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_water_entries_user_date ON water_entries(user_id, logged_at DESC);

ALTER TABLE water_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own water entries" ON water_entries
  FOR ALL USING (auth.uid() = user_id);