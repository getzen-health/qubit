-- Enable Row Level Security on subscription_tiers reference table.
-- This table contains plan metadata only (no user data).
-- Allow any authenticated or anonymous user to read tiers; no writes via client.

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subscription tiers"
  ON subscription_tiers FOR SELECT
  USING (true);
