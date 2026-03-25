CREATE TABLE IF NOT EXISTS missing_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  barcode TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE missing_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can report" ON missing_products
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can see own reports" ON missing_products
  FOR SELECT TO authenticated USING (user_id = auth.uid());
