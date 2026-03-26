-- Medication adherence tracker
-- Issue #568: Reminder schedule, compliance log, drug-food interactions

CREATE TABLE user_medications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  dose numeric(8,2),
  unit text,
  frequency text NOT NULL DEFAULT 'once_daily',
  times_of_day text[] NOT NULL DEFAULT '{"08:00"}',
  with_food boolean DEFAULT false,
  start_date date NOT NULL,
  end_date date,
  prescribing_doctor text,
  indication text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own medications"
  ON user_medications FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE medication_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_id uuid REFERENCES user_medications(id) ON DELETE CASCADE NOT NULL,
  scheduled_time timestamptz NOT NULL,
  taken_at timestamptz,
  skipped boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own medication logs"
  ON medication_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_med_logs_user_scheduled
  ON medication_logs(user_id, scheduled_time DESC);
