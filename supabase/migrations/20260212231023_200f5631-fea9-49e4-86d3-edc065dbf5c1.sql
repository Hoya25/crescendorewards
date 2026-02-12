
-- Add missing columns to bounties table
ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';
ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS xp_reward numeric DEFAULT 0;

-- Add missing columns to bounty_claims table
ALTER TABLE public.bounty_claims ADD COLUMN IF NOT EXISTS submission_url text;
ALTER TABLE public.bounty_claims ADD COLUMN IF NOT EXISTS submission_notes text;
