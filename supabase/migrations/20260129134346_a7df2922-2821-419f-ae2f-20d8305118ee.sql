-- Add required_status column
ALTER TABLE public.groundball_rewards 
ADD COLUMN required_status text DEFAULT 'any';

-- Populate required_status from existing tier column
UPDATE public.groundball_rewards 
SET required_status = COALESCE(tier, 'any');

-- Remove cost_groundball column
ALTER TABLE public.groundball_rewards 
DROP COLUMN cost_groundball;

-- Add check constraint for valid status values
ALTER TABLE public.groundball_rewards 
ADD CONSTRAINT valid_required_status 
CHECK (required_status IN ('any', 'bronze', 'silver', 'gold'));