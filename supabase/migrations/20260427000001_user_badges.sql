-- Create user_badges table for gamification
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  badge_rarity text NOT NULL DEFAULT 'bronze',
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  earned_at timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_rarity ON public.user_badges(badge_rarity);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at DESC);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can only see their own badges
CREATE POLICY "Users can view their own badges"
  ON public.user_badges
  FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can insert/update badges
CREATE POLICY "Service role can manage badges"
  ON public.user_badges
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create badge milestones table for tracking progress
CREATE TABLE IF NOT EXISTS public.badge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  target_count integer NOT NULL,
  progress_percentage integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Add indexes for badge progress
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_id ON public.badge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_progress_badge_type ON public.badge_progress(badge_type);

-- Enable RLS
ALTER TABLE public.badge_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own badge progress"
  ON public.badge_progress
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage progress
CREATE POLICY "Service role can manage badge progress"
  ON public.badge_progress
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
