-- Achievement/badge system
-- Tracks milestones earned by users as they use KQuarks

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏆',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, achievement_type)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements (user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Service role inserts (edge function)
CREATE POLICY "Service role can insert achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (true);
