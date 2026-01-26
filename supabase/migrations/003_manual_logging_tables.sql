-- Manual Logging Tables: Meals, Water, Fasting
-- Migration: 003_manual_logging_tables.sql

-- ============================================
-- MEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Breakfast", "Lunch", "Dinner", "Snack", or custom
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, logged_at DESC);

-- ============================================
-- MEAL ITEMS TABLE (foods within a meal)
-- ============================================
CREATE TABLE IF NOT EXISTS meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    barcode TEXT,
    serving_size TEXT NOT NULL DEFAULT '1 serving',
    servings DECIMAL(5,2) NOT NULL DEFAULT 1,
    calories INTEGER NOT NULL DEFAULT 0,
    protein DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat DECIMAL(6,2) NOT NULL DEFAULT 0,
    fiber DECIMAL(6,2),
    sugar DECIMAL(6,2),
    sodium DECIMAL(6,2),
    source TEXT CHECK (source IN ('barcode', 'ai_recognition', 'manual', 'search')),
    confidence DECIMAL(3,2), -- AI confidence score 0-1
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_user ON meal_items(user_id, created_at DESC);

-- ============================================
-- DAILY NUTRITION SUMMARY (aggregated from meals)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    calories_consumed INTEGER NOT NULL DEFAULT 0,
    calories_target INTEGER DEFAULT 2000,
    protein_consumed DECIMAL(6,2) NOT NULL DEFAULT 0,
    protein_target DECIMAL(6,2) DEFAULT 150,
    carbs_consumed DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs_target DECIMAL(6,2) DEFAULT 250,
    fat_consumed DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat_target DECIMAL(6,2) DEFAULT 65,
    fiber_consumed DECIMAL(6,2) DEFAULT 0,
    fiber_target DECIMAL(6,2) DEFAULT 30,
    meal_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date ON daily_nutrition(user_id, date DESC);

-- ============================================
-- WATER LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_ml INTEGER NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'quick_add', 'smart_bottle')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, logged_at DESC);

-- ============================================
-- DAILY WATER SUMMARY
-- ============================================
CREATE TABLE IF NOT EXISTS daily_water (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_ml INTEGER NOT NULL DEFAULT 0,
    target_ml INTEGER DEFAULT 2500,
    log_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_water_user_date ON daily_water(user_id, date DESC);

-- ============================================
-- FASTING SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fasting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol TEXT NOT NULL DEFAULT '16:8', -- e.g., "16:8", "18:6", "20:4", "OMAD"
    target_hours INTEGER NOT NULL DEFAULT 16,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    actual_hours DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_fasting_user_date ON fasting_sessions(user_id, started_at DESC);

-- ============================================
-- USER NUTRITION SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS user_nutrition_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    calorie_target INTEGER DEFAULT 2000,
    protein_target INTEGER DEFAULT 150,
    carbs_target INTEGER DEFAULT 250,
    fat_target INTEGER DEFAULT 65,
    fiber_target INTEGER DEFAULT 30,
    water_target_ml INTEGER DEFAULT 2500,
    default_fasting_protocol TEXT DEFAULT '16:8',
    default_fasting_hours INTEGER DEFAULT 16,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Meals
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own meals" ON meals
    FOR ALL USING (auth.uid() = user_id);

-- Meal Items
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own meal items" ON meal_items
    FOR ALL USING (auth.uid() = user_id);

-- Daily Nutrition
ALTER TABLE daily_nutrition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily nutrition" ON daily_nutrition
    FOR ALL USING (auth.uid() = user_id);

-- Water Logs
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own water logs" ON water_logs
    FOR ALL USING (auth.uid() = user_id);

-- Daily Water
ALTER TABLE daily_water ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily water" ON daily_water
    FOR ALL USING (auth.uid() = user_id);

-- Fasting Sessions
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own fasting sessions" ON fasting_sessions
    FOR ALL USING (auth.uid() = user_id);

-- User Nutrition Settings
ALTER TABLE user_nutrition_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own nutrition settings" ON user_nutrition_settings
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS FOR AUTO-UPDATING SUMMARIES
-- ============================================

-- Function to update daily nutrition summary when meal items change
CREATE OR REPLACE FUNCTION update_daily_nutrition()
RETURNS TRIGGER AS $$
DECLARE
    meal_date DATE;
    meal_user_id UUID;
BEGIN
    -- Get the meal date and user
    IF TG_OP = 'DELETE' THEN
        SELECT DATE(m.logged_at), m.user_id INTO meal_date, meal_user_id
        FROM meals m WHERE m.id = OLD.meal_id;
    ELSE
        SELECT DATE(m.logged_at), m.user_id INTO meal_date, meal_user_id
        FROM meals m WHERE m.id = NEW.meal_id;
    END IF;

    -- Recalculate daily totals
    INSERT INTO daily_nutrition (user_id, date, calories_consumed, protein_consumed, carbs_consumed, fat_consumed, fiber_consumed, meal_count)
    SELECT
        meal_user_id,
        meal_date,
        COALESCE(SUM(mi.calories * mi.servings), 0)::INTEGER,
        COALESCE(SUM(mi.protein * mi.servings), 0),
        COALESCE(SUM(mi.carbs * mi.servings), 0),
        COALESCE(SUM(mi.fat * mi.servings), 0),
        COALESCE(SUM(mi.fiber * mi.servings), 0),
        COUNT(DISTINCT mi.meal_id)
    FROM meal_items mi
    JOIN meals m ON m.id = mi.meal_id
    WHERE m.user_id = meal_user_id AND DATE(m.logged_at) = meal_date
    ON CONFLICT (user_id, date) DO UPDATE SET
        calories_consumed = EXCLUDED.calories_consumed,
        protein_consumed = EXCLUDED.protein_consumed,
        carbs_consumed = EXCLUDED.carbs_consumed,
        fat_consumed = EXCLUDED.fat_consumed,
        fiber_consumed = EXCLUDED.fiber_consumed,
        meal_count = EXCLUDED.meal_count,
        updated_at = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for meal items
DROP TRIGGER IF EXISTS trigger_update_daily_nutrition ON meal_items;
CREATE TRIGGER trigger_update_daily_nutrition
    AFTER INSERT OR UPDATE OR DELETE ON meal_items
    FOR EACH ROW EXECUTE FUNCTION update_daily_nutrition();

-- Function to update daily water summary when water logs change
CREATE OR REPLACE FUNCTION update_daily_water()
RETURNS TRIGGER AS $$
DECLARE
    log_date DATE;
    log_user_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        log_date := DATE(OLD.logged_at);
        log_user_id := OLD.user_id;
    ELSE
        log_date := DATE(NEW.logged_at);
        log_user_id := NEW.user_id;
    END IF;

    -- Recalculate daily totals
    INSERT INTO daily_water (user_id, date, total_ml, log_count)
    SELECT
        log_user_id,
        log_date,
        COALESCE(SUM(amount_ml), 0),
        COUNT(*)
    FROM water_logs
    WHERE user_id = log_user_id AND DATE(logged_at) = log_date
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_ml = EXCLUDED.total_ml,
        log_count = EXCLUDED.log_count,
        updated_at = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for water logs
DROP TRIGGER IF EXISTS trigger_update_daily_water ON water_logs;
CREATE TRIGGER trigger_update_daily_water
    AFTER INSERT OR UPDATE OR DELETE ON water_logs
    FOR EACH ROW EXECUTE FUNCTION update_daily_water();
