-- Helper: is this auth user an internal QA fixture?
CREATE OR REPLACE FUNCTION public.is_fixture_member(_auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.unified_profiles up
    WHERE up.auth_user_id = _auth_id
      AND COALESCE((up.crescendo_data->>'is_test_fixture')::boolean, false) = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_rewards', (SELECT COUNT(*) FROM rewards WHERE is_active = true),
    'total_brands', (SELECT COUNT(*) FROM brands WHERE is_active = true),
    'total_members', (SELECT COUNT(*) FROM profiles p WHERE NOT public.is_fixture_member(p.id)),
    'total_claims', (SELECT COUNT(*) FROM rewards_claims c WHERE NOT public.is_fixture_member(c.user_id)),
    'total_rewards_value', (SELECT COALESCE(SUM(cost), 0) FROM rewards WHERE is_active = true)
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid;
  v_stats jsonb;
begin
  v_user_id := auth.uid();

  if not public.has_role(v_user_id, 'admin') then
    raise exception 'Unauthorized: Admin access required';
  end if;

  select jsonb_build_object(
    'total_rewards', (select count(*) from rewards),
    'active_rewards', (select count(*) from rewards where is_active = true),
    'total_claims', (select count(*) from rewards_claims c where not public.is_fixture_member(c.user_id)),
    'pending_claims', (select count(*) from rewards_claims c where status = 'pending' and not public.is_fixture_member(c.user_id)),
    'approved_claims', (select count(*) from rewards_claims c where status = 'approved' and not public.is_fixture_member(c.user_id)),
    'shipped_claims', (select count(*) from rewards_claims c where status = 'shipped' and not public.is_fixture_member(c.user_id)),
    'completed_claims', (select count(*) from rewards_claims c where status = 'completed' and not public.is_fixture_member(c.user_id)),
    'total_users', (select count(*) from profiles p where not public.is_fixture_member(p.id)),
    'total_nctr_distributed', (select coalesce(sum(available_nctr + locked_nctr), 0) from profiles p where not public.is_fixture_member(p.id)),
    'total_claim_balance', (select coalesce(sum(claim_balance), 0) from profiles p where not public.is_fixture_member(p.id))
  ) into v_stats;

  return v_stats;
end;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();

  IF NOT has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles p WHERE NOT public.is_fixture_member(p.id)),
    'active_users_7d', (SELECT COUNT(*) FROM profiles p WHERE p.updated_at > NOW() - INTERVAL '7 days' AND NOT public.is_fixture_member(p.id)),
    'pending_claims', (SELECT COUNT(*) FROM rewards_claims c WHERE status = 'pending' AND NOT public.is_fixture_member(c.user_id)),
    'processing_claims', (SELECT COUNT(*) FROM rewards_claims c WHERE status = 'processing' AND NOT public.is_fixture_member(c.user_id)),
    'pending_submissions', (SELECT COUNT(*) FROM reward_submissions WHERE status = 'pending'),
    'revenue_this_month', COALESCE((SELECT SUM(amount_paid) FROM purchases pu WHERE status = 'completed' AND created_at > date_trunc('month', NOW()) AND NOT public.is_fixture_member(pu.user_id)), 0),
    'revenue_all_time', COALESCE((SELECT SUM(amount_paid) FROM purchases pu WHERE status = 'completed' AND NOT public.is_fixture_member(pu.user_id)), 0),
    'low_stock_rewards', (SELECT COUNT(*) FROM rewards WHERE is_active = true AND stock_quantity IS NOT NULL AND stock_quantity < 5),
    'total_rewards', (SELECT COUNT(*) FROM rewards WHERE is_active = true)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tier_user_counts()
RETURNS TABLE(tier_id uuid, tier_name text, user_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id as tier_id,
    st.tier_name,
    COUNT(up.id)::BIGINT as user_count
  FROM public.status_tiers st
  LEFT JOIN public.unified_profiles up
    ON up.current_tier_id = st.id
   AND COALESCE((up.crescendo_data->>'is_test_fixture')::boolean, false) = false
  GROUP BY st.id, st.tier_name
  ORDER BY st.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_fixture_member(uuid) TO authenticated, service_role;