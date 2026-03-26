CREATE TABLE IF NOT EXISTS cosmetics_scan_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode text NOT NULL,
  product_name text,
  brand text,
  score integer,
  grade text,
  image_url text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, barcode)
);
ALTER TABLE cosmetics_scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cosmetics scans" ON cosmetics_scan_history FOR ALL USING (auth.uid() = user_id);
