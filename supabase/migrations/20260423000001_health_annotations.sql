-- Health Annotations Table
-- Stores user notes and annotations for health data entries

CREATE TABLE IF NOT EXISTS health_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL, -- workout, meal, vital_sign, sleep, symptom, etc.
  entry_date DATE NOT NULL, -- The date of the annotated entry
  note TEXT NOT NULL,
  category TEXT, -- optional categorization (e.g., "injury", "travel", "stress", "cold")
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_type, entry_date) -- One annotation per entry per day
);

-- Indexes for efficient querying
CREATE INDEX idx_health_annotations_user_date ON health_annotations(user_id, entry_date DESC);
CREATE INDEX idx_health_annotations_user_type ON health_annotations(user_id, entry_type);
CREATE INDEX idx_health_annotations_user_category ON health_annotations(user_id, category);

-- Enable Row Level Security
ALTER TABLE health_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own annotations
CREATE POLICY "Users manage own health_annotations"
ON health_annotations FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_health_annotations_updated_at
  BEFORE UPDATE ON health_annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
