-- Add subscription tier support
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER, -- in cents, NULL for free tier
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO subscription_tiers (id, name, description, price_monthly) VALUES
    ('free', 'Free', 'Basic health tracking with limited history', NULL),
    ('pro', 'Pro', 'Unlimited history and all premium features', 999);

-- Add subscription_tier column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' REFERENCES subscription_tiers(id);

CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
