-- Drop constraints first
ALTER TABLE earning_opportunities 
DROP CONSTRAINT IF EXISTS earning_opportunities_earn_type_check;

ALTER TABLE earning_opportunities 
DROP CONSTRAINT IF EXISTS earning_opportunities_category_check;

-- Add new constraints that include both old and new values
ALTER TABLE earning_opportunities 
ADD CONSTRAINT earning_opportunities_earn_type_check 
CHECK (earn_type IN ('nctr', 'cashback', 'task', 'referral', 'purchase', 'activity'));

ALTER TABLE earning_opportunities 
ADD CONSTRAINT earning_opportunities_category_check 
CHECK (category IN ('shopping', 'apps', 'partners', 'community', 'impact', 'missions'));