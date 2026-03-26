CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  enabled boolean DEFAULT true,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  conditions jsonb NOT NULL DEFAULT '[]',
  logic text DEFAULT 'AND' CHECK (logic IN ('AND', 'OR')),
  message text NOT NULL,
  last_triggered_at timestamptz,
  trigger_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_id uuid REFERENCES alert_rules(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL,
  triggered_at timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false
);

CREATE INDEX ON alert_rules(user_id);
CREATE INDEX ON alert_history(user_id, triggered_at DESC);
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own alert rules" ON alert_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own alert history" ON alert_history FOR ALL USING (auth.uid() = user_id);
