-- Create function to get user activity for dashboard
CREATE OR REPLACE FUNCTION public.get_user_activity(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  title TEXT,
  description TEXT,
  amount NUMERIC,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  
  -- Reward claims
  SELECT 
    rc.id,
    'reward_claim'::TEXT as activity_type,
    'Claimed ' || r.title as title,
    'Reward redeemed' as description,
    r.cost::NUMERIC as amount,
    rc.claimed_at as created_at,
    jsonb_build_object('reward_id', r.id, 'reward_image', r.image_url) as metadata
  FROM rewards_claims rc
  JOIN rewards r ON r.id = rc.reward_id
  WHERE rc.user_id = p_user_id
  
  UNION ALL
  
  -- Purchases
  SELECT
    p.id,
    'purchase'::TEXT as activity_type,
    'Purchased ' || p.claims_amount || ' Claims' as title,
    p.package_name as description,
    p.amount_paid::NUMERIC as amount,
    p.created_at,
    jsonb_build_object('package_id', p.package_id) as metadata
  FROM purchases p
  WHERE p.user_id = p_user_id AND p.status = 'completed'
  
  UNION ALL
  
  -- Membership changes
  SELECT
    mh.id,
    'tier_change'::TEXT as activity_type,
    'Reached ' || mh.tier_name || ' Status' as title,
    COALESCE('Upgraded from ' || mh.previous_tier_name, 'Started membership') as description,
    mh.locked_nctr::NUMERIC as amount,
    mh.created_at,
    jsonb_build_object('tier_level', mh.tier_level, 'previous_tier', mh.previous_tier_name) as metadata
  FROM membership_history mh
  WHERE mh.user_id = p_user_id
  
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;