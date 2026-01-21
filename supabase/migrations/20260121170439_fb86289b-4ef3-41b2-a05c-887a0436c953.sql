-- Drop and recreate get_all_claims function with delivery fields
DROP FUNCTION IF EXISTS public.get_all_claims();

CREATE FUNCTION public.get_all_claims()
RETURNS TABLE(
  claim_id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  reward_id uuid,
  reward_title text,
  reward_cost integer,
  status text,
  claimed_at timestamp with time zone,
  shipping_info jsonb,
  delivery_method text,
  delivery_status text,
  delivery_data jsonb,
  delivered_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- Check if user is admin
  if not public.has_role(v_user_id, 'admin') then
    raise exception 'Unauthorized: Admin access required';
  end if;
  
  return query
  select 
    rc.id as claim_id,
    rc.user_id,
    p.email as user_email,
    p.full_name as user_name,
    rc.reward_id,
    r.title as reward_title,
    r.cost as reward_cost,
    rc.status,
    rc.claimed_at,
    rc.shipping_info,
    rc.delivery_method,
    rc.delivery_status,
    rc.delivery_data,
    rc.delivered_at
  from rewards_claims rc
  join profiles p on p.id = rc.user_id
  join rewards r on r.id = rc.reward_id
  order by rc.claimed_at desc;
end;
$$;

-- Create function to update delivery status
CREATE OR REPLACE FUNCTION public.update_claim_delivery_status(
  p_claim_id uuid,
  p_delivery_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- Check if user is admin
  if not public.has_role(v_user_id, 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  end if;
  
  -- Validate delivery status
  if p_delivery_status not in ('pending', 'processing', 'shipped', 'delivered', 'failed') then
    return jsonb_build_object('success', false, 'error', 'Invalid delivery status');
  end if;
  
  -- Update the delivery status
  update rewards_claims
  set 
    delivery_status = p_delivery_status,
    delivered_at = case when p_delivery_status = 'delivered' then now() else delivered_at end
  where id = p_claim_id;
  
  return jsonb_build_object('success', true);
end;
$$;