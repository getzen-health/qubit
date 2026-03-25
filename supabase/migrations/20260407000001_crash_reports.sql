CREATE TABLE IF NOT EXISTS crash_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal INTEGER,
  exception_type INTEGER,
  termination_reason TEXT,
  os_version TEXT,
  app_version TEXT,
  call_stack TEXT,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- No RLS needed — service role only writes here
