-- Add export_schedule column to user_preferences for scheduled PDF exports
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS export_schedule text DEFAULT 'none' CHECK (export_schedule IN ('none', 'weekly', 'monthly'));

-- Add index for querying scheduled exports
CREATE INDEX IF NOT EXISTS idx_user_preferences_export_schedule 
ON public.user_preferences(export_schedule) 
WHERE export_schedule != 'none';

-- Add last_export_sent_at to track when exports were emailed
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS last_export_sent_at timestamptz;
