-- Update Platinum and Diamond earning multipliers
UPDATE status_tiers SET earning_multiplier = 2.0 WHERE tier_name = 'platinum';
UPDATE status_tiers SET earning_multiplier = 2.5 WHERE tier_name = 'diamond';