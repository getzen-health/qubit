CREATE TABLE IF NOT EXISTS medications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  dosage text,
  frequency text,
  times_of_day text[] DEFAULT '{}',
  start_date date,
  end_date date,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medications" ON medications FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  taken_at timestamptz DEFAULT now(),
  dose_taken text,
  notes text
);
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medication logs" ON medication_logs FOR ALL USING (auth.uid() = user_id);
