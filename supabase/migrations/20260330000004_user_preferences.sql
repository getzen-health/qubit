CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  appearance_mode TEXT DEFAULT 'dark',
  accent_hue NUMERIC DEFAULT 220,
  accent_saturation NUMERIC DEFAULT 70,
  accent_lightness NUMERIC DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their preferences" ON user_preferences FOR ALL USING (user_id = auth.uid());
