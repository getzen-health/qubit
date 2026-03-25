-- Add user_id to crash_reports table for RLS policy
ALTER TABLE crash_reports
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for efficient queries
CREATE INDEX idx_crash_reports_user_id ON crash_reports(user_id);

-- Enable Row Level Security
ALTER TABLE crash_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own crash reports
CREATE POLICY "Users can read own crash reports"
  ON crash_reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Service role can insert crash reports (for iOS app via service role)
CREATE POLICY "Service role can insert crash reports"
  ON crash_reports FOR INSERT
  TO service_role
  WITH CHECK (true);
