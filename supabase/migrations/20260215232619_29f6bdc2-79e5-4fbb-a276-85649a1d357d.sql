
-- Add leaderboard opt-in to unified_profiles
ALTER TABLE public.unified_profiles 
ADD COLUMN IF NOT EXISTS leaderboard_opt_in boolean NOT NULL DEFAULT false;

-- Create function to get referral leaderboard (current month)
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month_start date;
  v_month_year text;
  v_top_10 jsonb;
  v_user_entry jsonb;
  v_user_rank int;
BEGIN
  v_month_start := date_trunc('month', now())::date;
  v_month_year := to_char(now(), 'YYYY-MM');

  -- Get top 10 opted-in users by referral count this month
  WITH monthly_referrals AS (
    SELECT 
      r.referrer_id,
      up.display_name,
      COUNT(*) as referral_count,
      COUNT(*) FILTER (WHERE r.is_paid = true) as paid_referrals
    FROM referrals r
    JOIN unified_profiles up ON up.auth_user_id = r.referrer_id
    WHERE r.created_at >= v_month_start
      AND up.leaderboard_opt_in = true
    GROUP BY r.referrer_id, up.display_name
  ),
  ranked AS (
    SELECT 
      referrer_id,
      display_name,
      referral_count,
      paid_referrals,
      ROW_NUMBER() OVER (ORDER BY referral_count DESC, paid_referrals DESC) as rank
    FROM monthly_referrals
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'rank', rank,
      'display_name', display_name,
      'referral_count', referral_count,
      'paid_referrals', paid_referrals,
      'is_current_user', (referrer_id = p_user_id)
    ) ORDER BY rank
  ), '[]'::jsonb)
  INTO v_top_10
  FROM ranked
  WHERE rank <= 10;

  -- Get current user's rank if they're opted in
  IF p_user_id IS NOT NULL THEN
    WITH monthly_referrals AS (
      SELECT 
        r.referrer_id,
        up.display_name,
        up.leaderboard_opt_in,
        COUNT(*) as referral_count,
        COUNT(*) FILTER (WHERE r.is_paid = true) as paid_referrals
      FROM referrals r
      JOIN unified_profiles up ON up.auth_user_id = r.referrer_id
      WHERE r.created_at >= v_month_start
        AND up.leaderboard_opt_in = true
      GROUP BY r.referrer_id, up.display_name, up.leaderboard_opt_in
    ),
    ranked AS (
      SELECT 
        referrer_id,
        display_name,
        leaderboard_opt_in,
        referral_count,
        paid_referrals,
        ROW_NUMBER() OVER (ORDER BY referral_count DESC, paid_referrals DESC) as rank
      FROM monthly_referrals
    )
    SELECT jsonb_build_object(
      'rank', rank,
      'display_name', display_name,
      'referral_count', referral_count,
      'paid_referrals', paid_referrals,
      'opted_in', leaderboard_opt_in
    )
    INTO v_user_entry
    FROM ranked
    WHERE referrer_id = p_user_id;

    -- If user has no referrals this month, check opt-in status
    IF v_user_entry IS NULL THEN
      SELECT jsonb_build_object(
        'rank', NULL,
        'display_name', up.display_name,
        'referral_count', 0,
        'paid_referrals', 0,
        'opted_in', up.leaderboard_opt_in
      )
      INTO v_user_entry
      FROM unified_profiles up
      WHERE up.auth_user_id = p_user_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'top_10', v_top_10,
    'current_user', COALESCE(v_user_entry, '{}'::jsonb),
    'month', v_month_year,
    'bonus_nctr', 5000
  );
END;
$$;

-- Create function to toggle leaderboard opt-in
CREATE OR REPLACE FUNCTION public.toggle_leaderboard_opt_in(p_user_id uuid, p_opt_in boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE unified_profiles
  SET leaderboard_opt_in = p_opt_in, updated_at = now()
  WHERE auth_user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'opted_in', p_opt_in);
END;
$$;
