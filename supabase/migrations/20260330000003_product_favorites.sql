CREATE TABLE IF NOT EXISTS product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode TEXT,
  product_name TEXT NOT NULL,
  brand TEXT,
  health_score INTEGER,
  nova_group INTEGER,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, barcode)
);
ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their favorites" ON product_favorites FOR ALL USING (user_id = auth.uid());
