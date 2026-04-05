-- AI interaction logging for future model training
-- Stores anonymized prompts, responses, and user feedback
-- Only populated when users opt-in to data sharing

CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('insight', 'chat', 'briefing')),
    provider TEXT NOT NULL CHECK (provider IN ('on_device', 'cloud', 'auto')),
    prompt_summary TEXT NOT NULL,
    response_text TEXT NOT NULL,
    rating TEXT CHECK (rating IN ('helpful', 'not_helpful', NULL)),
    health_context_hash TEXT,
    model_version TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying during training data export
CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX idx_ai_interactions_rating ON ai_interactions(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);

-- RLS: users can only read/write their own interactions
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own interactions"
    ON ai_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own interactions"
    ON ai_interactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
    ON ai_interactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
    ON ai_interactions FOR DELETE
    USING (auth.uid() = user_id);

-- Consent tracking table
CREATE TABLE IF NOT EXISTS ai_data_consent (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMPTZ,
    consent_version TEXT NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_data_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own consent"
    ON ai_data_consent FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
