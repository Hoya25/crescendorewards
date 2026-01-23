-- Fix infinite recursion on admin_users RLS policies (causing 500s in Admin Panel)
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can manage admin users" ON public.admin_users;

-- Allow admins/moderators (from user_roles) to read admin roster
CREATE POLICY "Admins can view admin users"
ON public.admin_users
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

-- Allow admins (from user_roles) to manage admin roster
CREATE POLICY "Admins can manage admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Security linter fix: set immutable search_path for get_all_claims
CREATE OR REPLACE FUNCTION public.get_all_claims()
 RETURNS TABLE(claim_id uuid, user_id uuid, user_email text, user_name text, reward_id uuid, reward_title text, reward_cost integer, status text, claimed_at timestamp with time zone, shipping_info jsonb, delivery_method text, delivery_status text, delivery_data jsonb, delivered_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;