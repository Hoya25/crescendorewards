-- Update earning multipliers to match the new spec
UPDATE public.status_tiers SET earning_multiplier = 1.0 WHERE tier_name = 'bronze';
UPDATE public.status_tiers SET earning_multiplier = 1.25 WHERE tier_name = 'silver';
UPDATE public.status_tiers SET earning_multiplier = 1.5 WHERE tier_name = 'gold';
UPDATE public.status_tiers SET earning_multiplier = 2.0 WHERE tier_name = 'platinum';
UPDATE public.status_tiers SET earning_multiplier = 3.0 WHERE tier_name = 'diamond';