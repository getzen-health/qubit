CREATE TABLE alcohol_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  drinks jsonb NOT NULL DEFAULT '[]', -- [{type, quantity, abv, oz, standard_drinks}]
  total_standard_drinks numeric(4,2) NOT NULL DEFAULT 0,
  with_food boolean DEFAULT false,
  time_of_last_drink time,
  sleep_quality_next_morning integer CHECK (sleep_quality_next_morning BETWEEN 1 AND 5),
  notes text,
  audit_c_score integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alcohol_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alcohol logs" ON alcohol_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_alcohol_logs_user_date ON alcohol_logs(user_id, date DESC);
