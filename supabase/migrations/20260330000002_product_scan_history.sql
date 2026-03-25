CREATE TABLE IF NOT EXISTS product_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode TEXT,
  product_name TEXT NOT NULL,
  brand TEXT,
  health_score INTEGER,
  nova_group INTEGER,
  nutriscore TEXT,
  thumbnail_url TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE product_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their scan history" ON product_scans FOR ALL USING (user_id = auth.uid());
CREATE INDEX product_scans_user_id_idx ON product_scans(user_id, scanned_at DESC);
