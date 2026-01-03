-- Create admin dashboard stats function
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is admin
  IF NOT has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users_7d', (SELECT COUNT(*) FROM profiles WHERE updated_at > NOW() - INTERVAL '7 days'),
    'pending_claims', (SELECT COUNT(*) FROM rewards_claims WHERE status = 'pending'),
    'processing_claims', (SELECT COUNT(*) FROM rewards_claims WHERE status = 'processing'),
    'pending_submissions', (SELECT COUNT(*) FROM reward_submissions WHERE status = 'pending'),
    'revenue_this_month', COALESCE((SELECT SUM(amount_paid) FROM purchases WHERE status = 'completed' AND created_at > date_trunc('month', NOW())), 0),
    'revenue_all_time', COALESCE((SELECT SUM(amount_paid) FROM purchases WHERE status = 'completed'), 0),
    'low_stock_rewards', (SELECT COUNT(*) FROM rewards WHERE is_active = true AND stock_quantity IS NOT NULL AND stock_quantity < 5),
    'total_rewards', (SELECT COUNT(*) FROM rewards WHERE is_active = true)
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$;

-- Create function to get recent admin activity
CREATE OR REPLACE FUNCTION public.get_recent_admin_activity(p_limit integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  activity_type text,
  title text,
  description text,
  created_at timestamp with time zone,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is admin
  IF NOT has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  RETURN QUERY
  
  -- New user signups
  SELECT 
    p.id,
    'new_user'::TEXT as activity_type,
    'New User Signup'::TEXT as title,
    COALESCE(p.full_name, p.email, 'Unknown User') as description,
    p.created_at,
    jsonb_build_object('user_id', p.id, 'email', p.email) as metadata
  FROM profiles p
  
  UNION ALL
  
  -- Completed purchases
  SELECT
    pu.id,
    'purchase'::TEXT as activity_type,
    'Purchase Completed'::TEXT as title,
    pu.package_name || ' - $' || (pu.amount_paid / 100.0)::TEXT as description,
    pu.created_at,
    jsonb_build_object('user_id', pu.user_id, 'amount', pu.amount_paid, 'package', pu.package_name) as metadata
  FROM purchases pu
  WHERE pu.status = 'completed'
  
  UNION ALL
  
  -- Reward claims
  SELECT
    rc.id,
    'claim'::TEXT as activity_type,
    'Reward Claimed'::TEXT as title,
    r.title as description,
    rc.claimed_at as created_at,
    jsonb_build_object('user_id', rc.user_id, 'reward_id', rc.reward_id, 'status', rc.status) as metadata
  FROM rewards_claims rc
  JOIN rewards r ON r.id = rc.reward_id
  
  UNION ALL
  
  -- Submissions (approved/rejected)
  SELECT
    rs.id,
    CASE 
      WHEN rs.status = 'approved' THEN 'submission_approved'::TEXT
      WHEN rs.status = 'rejected' THEN 'submission_rejected'::TEXT
      ELSE 'submission_pending'::TEXT
    END as activity_type,
    CASE 
      WHEN rs.status = 'approved' THEN 'Submission Approved'::TEXT
      WHEN rs.status = 'rejected' THEN 'Submission Rejected'::TEXT
      ELSE 'New Submission'::TEXT
    END as title,
    rs.title as description,
    rs.updated_at as created_at,
    jsonb_build_object('user_id', rs.user_id, 'status', rs.status) as metadata
  FROM reward_submissions rs
  
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$function$;