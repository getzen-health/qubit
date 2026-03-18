-- Migration 008: Habit tracker
-- Users define recurring habits and log daily completions.

CREATE TABLE habits (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    emoji       TEXT        NOT NULL DEFAULT '✅',
    -- days to track: array of 'mon','tue','wed','thu','fri','sat','sun'
    target_days TEXT[]      NOT NULL DEFAULT ARRAY['mon','tue','wed','thu','fri','sat','sun'],
    sort_order  SMALLINT    NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ          -- soft delete
);

CREATE TABLE habit_completions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id     UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date         DATE        NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (habit_id, date)
);

CREATE INDEX idx_habits_user ON habits(user_id) WHERE archived_at IS NULL;
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, date DESC);
CREATE INDEX idx_habit_completions_habit_date ON habit_completions(habit_id, date DESC);

-- Row Level Security
ALTER TABLE habits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habits"
    ON habits FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own habit completions"
    ON habit_completions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
