-- Add theme columns to user_preferences
-- appearance_mode already exists (TEXT); we add theme as an alias-style column
-- plus accent_color for preset name storage.
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT 'zinc';
