-- Drop and recreate the category constraint to include 'give-back'
ALTER TABLE groundball_rewards DROP CONSTRAINT IF EXISTS groundball_rewards_category_check;
ALTER TABLE groundball_rewards ADD CONSTRAINT groundball_rewards_category_check 
  CHECK (category = ANY (ARRAY['experiences'::text, 'gear'::text, 'apparel'::text, 'services'::text, 'giveback'::text, 'give-back'::text]));