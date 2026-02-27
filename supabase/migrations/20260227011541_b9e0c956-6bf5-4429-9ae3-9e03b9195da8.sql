
-- Add new columns to bounties table for Bounty Board integration
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS is_wide boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cap_per_month integer,
  ADD COLUMN IF NOT EXISTS progress_target integer,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
