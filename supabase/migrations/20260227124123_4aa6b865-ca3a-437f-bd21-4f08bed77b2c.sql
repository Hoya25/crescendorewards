-- Add multiplier columns to bounties table
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS multiplier_type text,
  ADD COLUMN IF NOT EXISTS multiplier_value numeric,
  ADD COLUMN IF NOT EXISTS multiplier_status_tiers jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.bounties.multiplier_type IS 'null=none, status_based=tier-scaled, flat_bonus=fixed multiplier';
COMMENT ON COLUMN public.bounties.multiplier_value IS 'For flat_bonus: the multiplier value (e.g. 2.0)';
COMMENT ON COLUMN public.bounties.multiplier_status_tiers IS 'For status_based: JSON map of tier->multiplier e.g. {"Bronze":1,"Silver":1.5}';
