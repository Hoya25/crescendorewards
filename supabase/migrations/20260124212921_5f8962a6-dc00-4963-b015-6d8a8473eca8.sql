-- Add structured benefit columns to status_tiers
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS earning_multiplier NUMERIC DEFAULT 1.0;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS claims_per_month INTEGER DEFAULT 0;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS claims_per_year INTEGER DEFAULT 0;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS unlimited_claims BOOLEAN DEFAULT false;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS priority_support BOOLEAN DEFAULT false;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS early_access BOOLEAN DEFAULT false;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS vip_events BOOLEAN DEFAULT false;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS concierge_service BOOLEAN DEFAULT false;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS custom_benefits JSONB DEFAULT '[]';
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS description TEXT;

-- Populate Bronze tier values
UPDATE status_tiers SET 
  earning_multiplier = 1.1,
  claims_per_year = 1,
  claims_per_month = 0,
  unlimited_claims = false,
  discount_percent = 0,
  priority_support = true,
  early_access = false,
  vip_events = false,
  concierge_service = false,
  free_shipping = false,
  description = 'Entry tier with enhanced earning potential',
  custom_benefits = '[]'::jsonb
WHERE tier_name = 'bronze';

-- Populate Silver tier values
UPDATE status_tiers SET 
  earning_multiplier = 1.25,
  claims_per_year = 4,
  claims_per_month = 0,
  unlimited_claims = false,
  discount_percent = 10,
  priority_support = true,
  early_access = true,
  vip_events = false,
  concierge_service = false,
  free_shipping = false,
  description = 'Enhanced benefits with quarterly claim privileges',
  custom_benefits = '[]'::jsonb
WHERE tier_name = 'silver';

-- Populate Gold tier values
UPDATE status_tiers SET 
  earning_multiplier = 1.4,
  claims_per_year = 12,
  claims_per_month = 1,
  unlimited_claims = false,
  discount_percent = 15,
  priority_support = true,
  early_access = true,
  vip_events = true,
  concierge_service = false,
  free_shipping = false,
  description = 'Elite status with monthly claims and exclusive perks',
  custom_benefits = '["Dedicated account manager", "Buy''r Premium membership"]'::jsonb
WHERE tier_name = 'gold';

-- Populate Platinum tier values
UPDATE status_tiers SET 
  earning_multiplier = 1.6,
  claims_per_year = 24,
  claims_per_month = 2,
  unlimited_claims = false,
  discount_percent = 20,
  priority_support = true,
  early_access = true,
  vip_events = true,
  concierge_service = true,
  free_shipping = true,
  description = 'Premium status with bi-monthly claims and concierge service',
  custom_benefits = '["Personal concierge service", "Priority shipping", "Buy''r Premium membership"]'::jsonb
WHERE tier_name = 'platinum';

-- Populate Diamond tier values
UPDATE status_tiers SET 
  earning_multiplier = 2.0,
  claims_per_year = 0,
  claims_per_month = 0,
  unlimited_claims = true,
  discount_percent = 25,
  priority_support = true,
  early_access = true,
  vip_events = true,
  concierge_service = true,
  free_shipping = true,
  description = 'Ultimate status with unlimited benefits and white-glove service',
  custom_benefits = '["White-glove concierge service", "Free expedited shipping", "Early access to all new features", "Buy''r Premium membership"]'::jsonb
WHERE tier_name = 'diamond';