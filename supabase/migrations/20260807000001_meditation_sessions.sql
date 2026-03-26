-- Meditation Sessions
-- Kabat-Zinn MBSR-aligned mindfulness tracking with mood/stress shift and attention quality

CREATE TABLE meditation_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    type            TEXT NOT NULL DEFAULT 'breath'
                        CHECK (type IN ('breath','body_scan','loving_kindness','open_awareness','mantra','walking','visualization','other')),
    duration_min    INTEGER NOT NULL CHECK (duration_min > 0 AND duration_min <= 480),
    quality_rating  SMALLINT NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
    distractions    SMALLINT NOT NULL DEFAULT 0 CHECK (distractions >= 0),
    mood_before     SMALLINT CHECK (mood_before BETWEEN 1 AND 10),
    mood_after      SMALLINT CHECK (mood_after BETWEEN 1 AND 10),
    stress_before   SMALLINT CHECK (stress_before BETWEEN 1 AND 10),
    stress_after    SMALLINT CHECK (stress_after BETWEEN 1 AND 10),
    insight         TEXT,
    mbsr_week       SMALLINT CHECK (mbsr_week BETWEEN 1 AND 8),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user timeline queries (most-recent-first)
CREATE INDEX idx_meditation_sessions_user_date
    ON meditation_sessions (user_id, date DESC);

-- Row Level Security
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meditation sessions"
    ON meditation_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions"
    ON meditation_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions"
    ON meditation_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meditation sessions"
    ON meditation_sessions FOR DELETE
    USING (auth.uid() = user_id);
