-- Fix status tier NCTR thresholds to be non-overlapping
-- Bronze: 100 - 999
-- Silver: 1000 - 4999  
-- Gold: 5000 - 14999
-- Platinum: 15000 - 49999
-- Diamond: 50000+ (no upper limit)

-- Update Bronze tier
UPDATE status_tiers 
SET 
  min_nctr_360_locked = 100,
  max_nctr_360_locked = 999,
  sort_order = 1,
  earning_multiplier = 1.1,
  claims_per_month = 0,
  claims_per_year = 1,
  discount_percent = 0,
  updated_at = now()
WHERE tier_name = 'bronze';

-- Update Silver tier
UPDATE status_tiers 
SET 
  min_nctr_360_locked = 1000,
  max_nctr_360_locked = 4999,
  sort_order = 2,
  earning_multiplier = 1.25,
  claims_per_month = 0,
  claims_per_year = 4,
  discount_percent = 10,
  updated_at = now()
WHERE tier_name = 'silver';

-- Update Gold tier
UPDATE status_tiers 
SET 
  min_nctr_360_locked = 5000,
  max_nctr_360_locked = 14999,
  sort_order = 3,
  earning_multiplier = 1.4,
  claims_per_month = 1,
  claims_per_year = 12,
  discount_percent = 15,
  updated_at = now()
WHERE tier_name = 'gold';

-- Update Platinum tier
UPDATE status_tiers 
SET 
  min_nctr_360_locked = 15000,
  max_nctr_360_locked = 49999,
  sort_order = 4,
  earning_multiplier = 1.6,
  claims_per_month = 2,
  claims_per_year = 24,
  discount_percent = 20,
  updated_at = now()
WHERE tier_name = 'platinum';

-- Update Diamond tier
UPDATE status_tiers 
SET 
  min_nctr_360_locked = 50000,
  max_nctr_360_locked = NULL,
  sort_order = 5,
  earning_multiplier = 2.0,
  claims_per_month = 0,
  claims_per_year = 0,
  unlimited_claims = true,
  discount_percent = 25,
  updated_at = now()
WHERE tier_name = 'diamond';