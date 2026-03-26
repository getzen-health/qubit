CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  mood_score integer CHECK (mood_score BETWEEN 1 AND 10),
  mood_label text,  -- 'anxious', 'calm', 'sad', 'happy', 'energised', 'irritable', 'grateful', 'stressed'
  energy_level integer CHECK (energy_level BETWEEN 1 AND 10),
  free_text text,          -- open journal entry
  gratitude_1 text,        -- CBT: gratitude practice
  gratitude_2 text,
  gratitude_3 text,
  challenge text,          -- CBT: what challenged you today
  reframe text,            -- CBT: how did you reframe it
  intentions text,         -- tomorrow's intentions
  streak_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entry_date)
);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal" ON journal_entries FOR ALL USING (auth.uid() = user_id);
