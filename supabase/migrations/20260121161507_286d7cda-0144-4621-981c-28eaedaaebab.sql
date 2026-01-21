-- Update status_tiers table to use Metals theme names
UPDATE status_tiers SET 
  tier_name = 'bronze',
  display_name = 'Bronze',
  badge_emoji = '🥉',
  badge_color = '#CD7F32',
  benefits = '["Access to bronze reward catalog", "1 reward claim per year", "Priority customer support", "Earn 1.1x NCTR on all activities"]'
WHERE tier_name = 'droplet';

UPDATE status_tiers SET 
  tier_name = 'silver',
  display_name = 'Silver',
  badge_emoji = '🥈',
  badge_color = '#C0C0C0',
  benefits = '["Access to premium reward catalog", "4 reward claims per year", "Early access to new rewards", "Earn 1.25x NCTR on all activities", "10% discount on partner brands"]'
WHERE tier_name = 'eddy';

UPDATE status_tiers SET 
  tier_name = 'gold',
  display_name = 'Gold',
  badge_emoji = '🥇',
  badge_color = '#FFD700',
  benefits = '["Access to exclusive reward catalog", "1 reward claim per month", "VIP event invitations", "Earn 1.4x NCTR on all activities", "15% discount on partner brands"]'
WHERE tier_name = 'spiral';

UPDATE status_tiers SET 
  tier_name = 'platinum',
  display_name = 'Platinum',
  badge_emoji = '💎',
  badge_color = '#E5E4E2',
  benefits = '["Access to platinum reward catalog", "2 reward claims per month", "Exclusive platinum events", "Earn 1.6x NCTR on all activities", "20% discount on partner brands"]'
WHERE tier_name = 'surge';

UPDATE status_tiers SET 
  tier_name = 'diamond',
  display_name = 'Diamond',
  badge_emoji = '👑',
  badge_color = '#00BFFF',
  benefits = '["Access to diamond reward catalog", "Unlimited reward claims", "Exclusive diamond experiences", "Earn 2x NCTR on all activities", "25% discount on partner brands"]'
WHERE tier_name = 'torus';

-- Update any rewards that reference old tier names in min_status_tier
UPDATE rewards SET min_status_tier = 'bronze' WHERE min_status_tier = 'droplet';
UPDATE rewards SET min_status_tier = 'silver' WHERE min_status_tier = 'eddy';
UPDATE rewards SET min_status_tier = 'gold' WHERE min_status_tier = 'spiral';
UPDATE rewards SET min_status_tier = 'platinum' WHERE min_status_tier = 'surge';
UPDATE rewards SET min_status_tier = 'diamond' WHERE min_status_tier = 'torus';

-- Update status_tier_claims_cost JSONB to use new tier names
UPDATE rewards 
SET status_tier_claims_cost = jsonb_build_object(
  'bronze', COALESCE((status_tier_claims_cost->>'droplet')::integer, cost),
  'silver', COALESCE((status_tier_claims_cost->>'eddy')::integer, cost),
  'gold', COALESCE((status_tier_claims_cost->>'spiral')::integer, cost),
  'platinum', COALESCE((status_tier_claims_cost->>'surge')::integer, cost),
  'diamond', COALESCE((status_tier_claims_cost->>'torus')::integer, cost)
)
WHERE status_tier_claims_cost IS NOT NULL 
  AND status_tier_claims_cost ? 'droplet';