-- Add sponsor and limited quantity columns to groundball_rewards
ALTER TABLE groundball_rewards ADD COLUMN IF NOT EXISTS sponsor_name TEXT;
ALTER TABLE groundball_rewards ADD COLUMN IF NOT EXISTS sponsor_logo_url TEXT;
ALTER TABLE groundball_rewards ADD COLUMN IF NOT EXISTS is_limited BOOLEAN DEFAULT false;
ALTER TABLE groundball_rewards ADD COLUMN IF NOT EXISTS quantity_available INTEGER;
ALTER TABLE groundball_rewards ADD COLUMN IF NOT EXISTS quantity_claimed INTEGER DEFAULT 0;
ALTER TABLE groundball_rewards ADD COLUMN IF NOT EXISTS claims_cost INTEGER DEFAULT 25;