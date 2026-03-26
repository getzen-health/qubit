-- Lab Results & Doctor Visits — personal health records

CREATE TABLE lab_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_date date NOT NULL,
  panel_name text,
  markers jsonb NOT NULL DEFAULT '{}', -- {marker_id: value}
  lab_name text,
  ordering_provider text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lab results"
  ON lab_results FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_lab_results_user_date ON lab_results(user_id, test_date DESC);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE doctor_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visit_date date NOT NULL,
  provider_name text,
  visit_type text,
  chief_complaint text,
  diagnoses text[],
  medications_changed jsonb DEFAULT '[]',
  follow_up_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own doctor visits"
  ON doctor_visits FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_doctor_visits_user_date ON doctor_visits(user_id, visit_date DESC);
