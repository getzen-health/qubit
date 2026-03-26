CREATE TABLE IF NOT EXISTS sleep_hygiene_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date date DEFAULT CURRENT_DATE,
  bed_time time,
  wake_time time,
  sleep_quality integer CHECK (sleep_quality BETWEEN 1 AND 10),
  room_temp_celsius numeric(4,1),
  room_dark boolean DEFAULT false,
  room_quiet boolean DEFAULT false,
  no_alcohol boolean DEFAULT true,
  no_caffeine_6h boolean DEFAULT true,
  no_screens_1h boolean DEFAULT false,
  consistent_schedule boolean DEFAULT false,
  notes text,
  hygiene_score integer,
  hygiene_grade text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, logged_date)
);
CREATE INDEX ON sleep_hygiene_logs(user_id, logged_date DESC);
ALTER TABLE sleep_hygiene_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sleep hygiene" ON sleep_hygiene_logs FOR ALL USING (auth.uid() = user_id);
