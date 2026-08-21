-- Recognise the fixture by either id space (auth id or unified profile id).
CREATE OR REPLACE FUNCTION public.is_fixture_member(_auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.unified_profiles up
    WHERE (up.auth_user_id = _auth_id OR up.id = _auth_id)
      AND COALESCE((up.crescendo_data->>'is_test_fixture')::boolean, false) = true
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_gift_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_stats jsonb;
BEGIN
  WITH g AS (
    SELECT * FROM claim_gifts cg
    WHERE NOT public.is_fixture_member(cg.sender_id)
      AND (cg.recipient_id IS NULL OR NOT public.is_fixture_member(cg.recipient_id))
  )
  SELECT jsonb_build_object(
    'total_gifts', (SELECT COUNT(*) FROM g),
    'total_claims_gifted', (SELECT COALESCE(SUM(claims_amount), 0) FROM g),
    'pending_gifts', (SELECT COUNT(*) FROM g WHERE status = 'pending'),
    'claimed_gifts', (SELECT COUNT(*) FROM g WHERE status = 'claimed'),
    'expired_gifts', (SELECT COUNT(*) FROM g WHERE status = 'expired'),
    'admin_gifts', (SELECT COUNT(*) FROM g WHERE is_admin_gift = true),
    'user_gifts', (SELECT COUNT(*) FROM g WHERE is_admin_gift = false),
    'admin_claims_gifted', (SELECT COALESCE(SUM(claims_amount), 0) FROM g WHERE is_admin_gift = true),
    'user_claims_gifted', (SELECT COALESCE(SUM(claims_amount), 0) FROM g WHERE is_admin_gift = false)
  ) INTO v_stats;

  RETURN v_stats;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_wishlist_analytics()
RETURNS TABLE(reward_id uuid, reward_title text, reward_cost integer, reward_image text, reward_category text, wishlist_count bigint, recent_adds bigint, avg_days_on_wishlist numeric, is_trending boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    r.id as reward_id,
    r.title as reward_title,
    r.cost as reward_cost,
    r.image_url as reward_image,
    r.category as reward_category,
    COUNT(w.id) as wishlist_count,
    COUNT(w.id) FILTER (WHERE w.created_at >= NOW() - INTERVAL '7 days') as recent_adds,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - w.created_at)) / 86400), 1) as avg_days_on_wishlist,
    (COUNT(w.id) FILTER (WHERE w.created_at >= NOW() - INTERVAL '7 days') > 2) as is_trending
  FROM rewards r
  LEFT JOIN reward_wishlists w
    ON w.reward_id = r.id
   AND NOT public.is_fixture_member(w.user_id)
  WHERE r.is_active = true
  GROUP BY r.id, r.title, r.cost, r.image_url, r.category
  HAVING COUNT(w.id) > 0
  ORDER BY wishlist_count DESC, recent_adds DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_gift_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_gift_stats() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_wishlist_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_wishlist_analytics() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_fixture_member(uuid) FROM PUBLIC, anon, authenticated;