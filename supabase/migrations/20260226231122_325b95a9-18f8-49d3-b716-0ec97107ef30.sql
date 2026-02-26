-- Add bounty_status enum type
DO $$ BEGIN
  CREATE TYPE public.bounty_status AS ENUM ('active', 'paused', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add status column to bounties table, default 'active'
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS status public.bounty_status NOT NULL DEFAULT 'active';

-- Backfill: sync status from existing is_active column
UPDATE public.bounties SET status = CASE WHEN is_active = true THEN 'active'::public.bounty_status ELSE 'paused'::public.bounty_status END;