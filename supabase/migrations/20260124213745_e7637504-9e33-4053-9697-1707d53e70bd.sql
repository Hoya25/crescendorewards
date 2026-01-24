-- Create tier changes log table for tracking admin modifications
CREATE TABLE public.tier_changes_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_id UUID NOT NULL REFERENCES public.status_tiers(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES public.unified_profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  change_summary TEXT
);

-- Enable RLS
ALTER TABLE public.tier_changes_log ENABLE ROW LEVEL SECURITY;

-- Admin-only read policy
CREATE POLICY "Admins can view tier change logs"
ON public.tier_changes_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Admin-only insert policy
CREATE POLICY "Admins can create tier change logs"
ON public.tier_changes_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create tier promotions table for temporary benefit boosts
CREATE TABLE public.tier_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  multiplier_bonus NUMERIC DEFAULT 0,
  claims_bonus INTEGER DEFAULT 0,
  discount_bonus INTEGER DEFAULT 0,
  applies_to_tiers TEXT[] DEFAULT ARRAY['bronze', 'silver', 'gold', 'platinum', 'diamond'],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.unified_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tier_promotions ENABLE ROW LEVEL SECURITY;

-- Public read for active promotions (users need to see bonuses)
CREATE POLICY "Anyone can view active promotions"
ON public.tier_promotions
FOR SELECT
USING (is_active = true AND now() BETWEEN start_date AND end_date);

-- Admin full access
CREATE POLICY "Admins can manage promotions"
ON public.tier_promotions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.unified_profiles up ON au.user_id = up.id
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create function to get user counts per tier
CREATE OR REPLACE FUNCTION public.get_tier_user_counts()
RETURNS TABLE (
  tier_id UUID,
  tier_name TEXT,
  user_count BIGINT
) 
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
  LEFT JOIN public.unified_profiles up ON up.current_tier_id = st.id
  GROUP BY st.id, st.tier_name
  ORDER BY st.sort_order;
END;
$$;