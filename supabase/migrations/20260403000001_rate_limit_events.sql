-- Rate limit events table for cross-instance rate limiting on Vercel serverless
-- Replaces the in-memory Map that loses state between function invocations.

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT    NOT NULL,          -- "<endpoint>:<identifier>"
  endpoint    TEXT    NOT NULL,
  identifier  TEXT    NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast window-based count queries
CREATE INDEX IF NOT EXISTS rate_limit_events_key_created
  ON rate_limit_events (key, created_at);

-- Auto-purge rows older than 1 hour to keep the table small
CREATE OR REPLACE FUNCTION prune_rate_limit_events() RETURNS void
LANGUAGE sql AS $$
  DELETE FROM rate_limit_events WHERE created_at < now() - INTERVAL '1 hour';
$$;

-- No RLS needed – this table is only accessed via service-role or anon-key
-- server-side code; users never query it directly.
