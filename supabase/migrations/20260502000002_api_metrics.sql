-- Create api_metrics table for monitoring and alerting
CREATE TABLE IF NOT EXISTS public.api_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL,
  duration_ms     INTEGER NOT NULL,
  status_code     INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_metrics_user_created 
  ON public.api_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_created 
  ON public.api_metrics(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_created 
  ON public.api_metrics(created_at DESC);

-- Enable row-level security
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own metrics (for admins: disable or modify)
CREATE POLICY "Users see own metrics"
  ON public.api_metrics FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Policy: Service role can insert metrics
CREATE POLICY "Service role can insert metrics"
  ON public.api_metrics FOR INSERT
  WITH CHECK (true);
