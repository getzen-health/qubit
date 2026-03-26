-- Health Goals: SMART framework + WOOP method (Oettingen 2012)
-- SMART: Specific, Measurable, Achievable, Relevant, Time-bound
-- WOOP:  Wish, Outcome, Obstacle, Plan (implementation intention)

CREATE TABLE health_goals (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Core
    title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    category         TEXT NOT NULL DEFAULT 'custom'
                         CHECK (category IN (
                             'weight_loss','muscle_gain','cardio_fitness','flexibility',
                             'nutrition','sleep','mental_health','stress_reduction',
                             'habits','hydration','custom'
                         )),

    -- SMART fields
    specific         TEXT NOT NULL DEFAULT '',
    metric           TEXT NOT NULL DEFAULT '',
    target_value     NUMERIC NOT NULL DEFAULT 0 CHECK (target_value >= 0),
    current_value    NUMERIC NOT NULL DEFAULT 0 CHECK (current_value >= 0),
    unit             TEXT NOT NULL DEFAULT '',
    start_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date      DATE NOT NULL,

    -- WOOP fields (Oettingen mental contrasting)
    wish             TEXT NOT NULL DEFAULT '',
    outcome          TEXT NOT NULL DEFAULT '',
    obstacle         TEXT NOT NULL DEFAULT '',
    plan             TEXT NOT NULL DEFAULT '',   -- if [obstacle] then I will [action]

    -- Status & motivation
    status           TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','completed','paused','abandoned')),
    motivation_level SMALLINT NOT NULL DEFAULT 7 CHECK (motivation_level BETWEEN 1 AND 10),

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: user timeline (most recent first)
CREATE INDEX idx_health_goals_user_status
    ON health_goals (user_id, status, created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_health_goals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_health_goals_updated_at
    BEFORE UPDATE ON health_goals
    FOR EACH ROW EXECUTE FUNCTION set_health_goals_updated_at();

-- Row Level Security
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own health goals"
    ON health_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health goals"
    ON health_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health goals"
    ON health_goals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health goals"
    ON health_goals FOR DELETE
    USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Goal Check-ins: periodic progress logging
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE goal_checkins (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id              UUID NOT NULL REFERENCES health_goals(id) ON DELETE CASCADE,

    date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    current_value        NUMERIC NOT NULL DEFAULT 0 CHECK (current_value >= 0),
    progress_rating      SMALLINT NOT NULL CHECK (progress_rating BETWEEN 1 AND 5),
    obstacle_encountered TEXT,
    plan_executed        BOOLEAN NOT NULL DEFAULT FALSE,
    motivation_level     SMALLINT NOT NULL CHECK (motivation_level BETWEEN 1 AND 10),
    notes                TEXT CHECK (char_length(notes) <= 1000),

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for per-goal history queries (most recent first)
CREATE INDEX idx_goal_checkins_goal_date
    ON goal_checkins (goal_id, date DESC);

-- Index for user-level queries
CREATE INDEX idx_goal_checkins_user_date
    ON goal_checkins (user_id, date DESC);

-- Row Level Security
ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own goal checkins"
    ON goal_checkins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal checkins"
    ON goal_checkins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal checkins"
    ON goal_checkins FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal checkins"
    ON goal_checkins FOR DELETE
    USING (auth.uid() = user_id);
