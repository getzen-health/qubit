-- Create user_integrations table for third-party wearable integrations
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR NOT NULL, -- 'strava', 'garmin', 'fitbit', etc.
    access_token VARCHAR NOT NULL, -- encrypted JWT or oauth token
    refresh_token VARCHAR, -- encrypted refresh token if available
    expires_at TIMESTAMP, -- token expiration time
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, provider)
);

-- Enable Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only view their own integrations
CREATE POLICY "Users can view their own integrations"
    ON user_integrations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: users can insert their own integrations
CREATE POLICY "Users can insert their own integrations"
    ON user_integrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own integrations
CREATE POLICY "Users can update their own integrations"
    ON user_integrations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy: users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
    ON user_integrations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_user_provider ON user_integrations(user_id, provider);
