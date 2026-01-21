-- Fix search_path for the update_claim_delivery_status function
CREATE OR REPLACE FUNCTION public.update_claim_delivery_status(
  p_claim_id uuid,
  p_delivery_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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