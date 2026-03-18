-- Migration 007: Daily check-ins for subjective wellness tracking
-- Users log their energy, mood, and stress levels each day.

CREATE TABLE daily_checkins (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       DATE        NOT NULL,
    -- 1 = very low/bad, 5 = very high/good
    energy     SMALLINT    CHECK (energy  BETWEEN 1 AND 5),
    mood       SMALLINT    CHECK (mood    BETWEEN 1 AND 5),
    stress     SMALLINT    CHECK (stress  BETWEEN 1 AND 5),
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daily_checkins_updated_at ON daily_checkins;
CREATE TRIGGER daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Row-Level Security
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own check-ins"
    ON daily_checkins FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
