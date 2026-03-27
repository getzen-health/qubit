-- Oral hygiene daily logs
CREATE TABLE oral_hygiene_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sessions INTEGER NOT NULL DEFAULT 0 CHECK (sessions >= 0 AND sessions <= 5),
    morning BOOLEAN DEFAULT FALSE,
    afternoon BOOLEAN DEFAULT FALSE,
    evening BOOLEAN DEFAULT FALSE,
    total_duration_seconds INTEGER DEFAULT 0 CHECK (total_duration_seconds >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, logged_date)
);

ALTER TABLE oral_hygiene_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own oral hygiene logs" ON oral_hygiene_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_oral_hygiene_user_date ON oral_hygiene_logs(user_id, logged_date DESC);

CREATE TRIGGER oral_hygiene_logs_updated_at
    BEFORE UPDATE ON oral_hygiene_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
