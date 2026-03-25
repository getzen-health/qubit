-- ============================================================
-- Strength Training: sessions + sets persistence
-- Closes issue #29
-- ============================================================

-- A strength session ties to a date and optionally a workout_record
CREATE TABLE IF NOT EXISTS strength_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_record_id UUID REFERENCES workout_records(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strength_sessions_user_date ON strength_sessions(user_id, session_date DESC);

-- Individual sets within a session
CREATE TABLE IF NOT EXISTS strength_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES strength_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    set_number INTEGER NOT NULL CHECK (set_number >= 1),
    reps INTEGER CHECK (reps >= 0),
    weight_kg DOUBLE PRECISION CHECK (weight_kg >= 0),
    completed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strength_sets_session ON strength_sets(session_id);
CREATE INDEX idx_strength_sets_user_exercise ON strength_sets(user_id, exercise_name);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE strength_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own strength sessions"
    ON strength_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own strength sets"
    ON strength_sets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────

CREATE TRIGGER update_strength_sessions_updated_at
    BEFORE UPDATE ON strength_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
