-- Add missing columns to groundball_rewards table
ALTER TABLE public.groundball_rewards 
ADD COLUMN IF NOT EXISTS cadence TEXT DEFAULT 'quarterly',
ADD COLUMN IF NOT EXISTS cadence_description TEXT,
ADD COLUMN IF NOT EXISTS is_giveback BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.groundball_rewards.cadence IS 'Reward frequency: daily, monthly, quarterly, annual, one_time';
COMMENT ON COLUMN public.groundball_rewards.cadence_description IS 'Human-readable cadence like "1 session per quarter" or "Always-on access"';
COMMENT ON COLUMN public.groundball_rewards.is_giveback IS 'If true, this reward does not count against member allocation';