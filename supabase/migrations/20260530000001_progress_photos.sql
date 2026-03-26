CREATE TABLE IF NOT EXISTS progress_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  storage_path text NOT NULL,
  category text DEFAULT 'front' CHECK (category IN ('front', 'back', 'side', 'face', 'other')),
  notes text,
  weight_kg numeric(5,1),
  body_fat_pct numeric(4,1),
  taken_at date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress photos" ON progress_photos FOR ALL USING (auth.uid() = user_id);
-- NOTE: Create storage bucket 'progress-photos' with private access, 5MB limit (manual step)
