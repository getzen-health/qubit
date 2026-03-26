CREATE TABLE biometric_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  neck_cm numeric(5,1),
  chest_cm numeric(5,1),
  arm_cm numeric(5,1),
  thigh_cm numeric(5,1),
  calf_cm numeric(5,1),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE biometric_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own biometrics" ON biometric_logs FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_biometric_user_date ON biometric_logs(user_id, date DESC);

CREATE TABLE biometric_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  height_cm numeric(5,1),
  sex text CHECK (sex IN ('male','female','other')),
  ethnicity text DEFAULT 'european',
  target_weight_kg numeric(5,2),
  target_date date,
  goal_type text DEFAULT 'maintain' CHECK (goal_type IN ('lose','maintain','gain')),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE biometric_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own biometric settings" ON biometric_settings FOR ALL USING (auth.uid() = user_id);
