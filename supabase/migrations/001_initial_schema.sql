-- Health App Database Schema
-- Initial migration: Core tables for health data tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & SETTINGS
-- ============================================

-- User profiles (extends Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User AI provider settings
CREATE TABLE user_ai_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'claude', -- claude, openai, custom
    api_key_encrypted TEXT, -- encrypted API key for user-provided keys
    custom_endpoint TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Device/source tracking
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL, -- iphone, apple_watch, android
    device_id TEXT, -- unique device identifier
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- ============================================
-- HEALTH DATA - RAW SAMPLES
-- ============================================

-- Generic health records for all sample types
CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- steps, heart_rate, weight, etc.
    value DOUBLE PRECISION NOT NULL,
    unit TEXT NOT NULL, -- count, bpm, kg, etc.
    source TEXT, -- device/app that recorded it
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_health_records_user_type ON health_records(user_id, type);
CREATE INDEX idx_health_records_user_time ON health_records(user_id, start_time DESC);
CREATE INDEX idx_health_records_type_time ON health_records(type, start_time DESC);

-- ============================================
-- SLEEP DATA
-- ============================================

-- Sleep sessions
CREATE TABLE sleep_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    -- Sleep stages in minutes
    awake_minutes INTEGER DEFAULT 0,
    rem_minutes INTEGER DEFAULT 0,
    core_minutes INTEGER DEFAULT 0, -- light sleep
    deep_minutes INTEGER DEFAULT 0,
    -- Quality metrics
    sleep_quality_score INTEGER, -- 0-100
    time_to_sleep_minutes INTEGER,
    wake_count INTEGER DEFAULT 0,
    source TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sleep_records_user_time ON sleep_records(user_id, start_time DESC);

-- ============================================
-- WORKOUT DATA
-- ============================================

-- Workout sessions
CREATE TABLE workout_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_type TEXT NOT NULL, -- running, cycling, strength, etc.
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    -- Energy
    active_calories DOUBLE PRECISION,
    total_calories DOUBLE PRECISION,
    -- Distance (if applicable)
    distance_meters DOUBLE PRECISION,
    -- Heart rate
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    -- Other metrics
    elevation_gain_meters DOUBLE PRECISION,
    avg_pace_per_km DOUBLE PRECISION, -- seconds per km
    source TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_records_user_time ON workout_records(user_id, start_time DESC);
CREATE INDEX idx_workout_records_user_type ON workout_records(user_id, workout_type);

-- ============================================
-- HEART RATE DATA
-- ============================================

-- Heart rate samples (high-frequency data)
CREATE TABLE heart_rate_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    bpm INTEGER NOT NULL,
    context TEXT, -- resting, active, workout, sleep
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioned index for time-series queries
CREATE INDEX idx_hr_samples_user_time ON heart_rate_samples(user_id, timestamp DESC);

-- Daily heart rate summaries
CREATE TABLE daily_heart_rate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    resting_hr INTEGER,
    avg_hr INTEGER,
    min_hr INTEGER,
    max_hr INTEGER,
    hrv_avg DOUBLE PRECISION, -- HRV SDNN average
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_hr_user_date ON daily_heart_rate(user_id, date DESC);

-- ============================================
-- DAILY SUMMARIES
-- ============================================

-- Aggregated daily health summaries
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Activity
    steps INTEGER DEFAULT 0,
    distance_meters DOUBLE PRECISION DEFAULT 0,
    floors_climbed INTEGER DEFAULT 0,
    active_calories DOUBLE PRECISION DEFAULT 0,
    total_calories DOUBLE PRECISION DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    -- Sleep (from previous night)
    sleep_duration_minutes INTEGER,
    sleep_quality_score INTEGER,
    -- Heart
    resting_heart_rate INTEGER,
    avg_hrv DOUBLE PRECISION,
    -- Body (latest readings)
    weight_kg DOUBLE PRECISION,
    body_fat_percent DOUBLE PRECISION,
    -- Scores
    recovery_score INTEGER, -- 0-100, calculated
    strain_score INTEGER, -- 0-100, calculated
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);

-- ============================================
-- AI INSIGHTS
-- ============================================

-- AI-generated health insights
CREATE TABLE health_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    insight_type TEXT NOT NULL, -- daily_summary, trend, anomaly, recommendation
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal', -- low, normal, high
    category TEXT, -- sleep, activity, heart, nutrition
    ai_provider TEXT, -- claude, openai
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_user_date ON health_insights(user_id, date DESC);
CREATE INDEX idx_insights_user_unread ON health_insights(user_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE heart_rate_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_heart_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insights ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- AI Settings policies
CREATE POLICY "Users can manage own AI settings" ON user_ai_settings
    FOR ALL USING (auth.uid() = user_id);

-- Device policies
CREATE POLICY "Users can manage own devices" ON user_devices
    FOR ALL USING (auth.uid() = user_id);

-- Health records policies
CREATE POLICY "Users can manage own health records" ON health_records
    FOR ALL USING (auth.uid() = user_id);

-- Sleep records policies
CREATE POLICY "Users can manage own sleep records" ON sleep_records
    FOR ALL USING (auth.uid() = user_id);

-- Workout records policies
CREATE POLICY "Users can manage own workout records" ON workout_records
    FOR ALL USING (auth.uid() = user_id);

-- Heart rate policies
CREATE POLICY "Users can manage own HR samples" ON heart_rate_samples
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily HR" ON daily_heart_rate
    FOR ALL USING (auth.uid() = user_id);

-- Daily summaries policies
CREATE POLICY "Users can manage own daily summaries" ON daily_summaries
    FOR ALL USING (auth.uid() = user_id);

-- Insights policies
CREATE POLICY "Users can manage own insights" ON health_insights
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_ai_settings_updated_at
    BEFORE UPDATE ON user_ai_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_daily_summaries_updated_at
    BEFORE UPDATE ON daily_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
