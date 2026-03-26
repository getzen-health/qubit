CREATE TABLE IF NOT EXISTS lab_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  biomarker_key text NOT NULL,
  value numeric NOT NULL,
  unit text,
  lab_date date NOT NULL DEFAULT CURRENT_DATE,
  lab_name text,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON lab_results(user_id, biomarker_key, lab_date DESC);
CREATE INDEX ON lab_results(user_id, lab_date DESC);
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own lab results" ON lab_results FOR ALL USING (auth.uid() = user_id);
