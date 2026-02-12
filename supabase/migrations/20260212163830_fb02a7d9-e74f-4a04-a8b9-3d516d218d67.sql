
-- Step 3: Create nctr_transactions table with multiplier tracking
CREATE TABLE IF NOT EXISTS public.nctr_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.unified_profiles(id),
  source TEXT NOT NULL, -- e.g. 'bounty', 'merch_purchase', 'referral', 'onboarding'
  source_id UUID, -- optional reference to bounty_id, purchase_id, etc.
  base_amount NUMERIC NOT NULL,
  status_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  merch_lock_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  final_amount NUMERIC NOT NULL,
  lock_type TEXT DEFAULT '360lock', -- '360lock' or '90lock'
  tier_at_time TEXT, -- tier_name snapshot at time of earning
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nctr_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.nctr_transactions FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
  ));

-- Only backend/admin can insert
CREATE POLICY "Service role can insert transactions"
  ON public.nctr_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
      AND is_active = true
    )
  );

-- Step 4: Create calculation function (corrected to use current_tier_id join)
CREATE OR REPLACE FUNCTION public.calculate_nctr_reward(
  p_user_id UUID,
  p_base_amount NUMERIC,
  p_is_merch_360lock BOOLEAN DEFAULT false
)
RETURNS TABLE(
  base_amount NUMERIC,
  status_multiplier NUMERIC,
  merch_lock_multiplier NUMERIC,
  final_amount NUMERIC,
  user_tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier TEXT;
  v_status_mult NUMERIC;
  v_merch_mult NUMERIC;
BEGIN
  -- Get user's current tier and multiplier via current_tier_id
  SELECT st.tier_name, st.earning_multiplier
  INTO v_tier, v_status_mult
  FROM unified_profiles up
  JOIN status_tiers st ON up.current_tier_id = st.id
  WHERE up.id = p_user_id;

  -- Default to bronze if no tier found
  IF v_tier IS NULL THEN
    v_tier := 'bronze';
    v_status_mult := 1.0;
  END IF;

  -- Set merch multiplier
  IF p_is_merch_360lock THEN
    v_merch_mult := 3.0;
  ELSE
    v_merch_mult := 1.0;
  END IF;

  RETURN QUERY SELECT
    p_base_amount,
    v_status_mult,
    v_merch_mult,
    ROUND(p_base_amount * v_merch_mult * v_status_mult, 0),
    v_tier;
END;
$$;
