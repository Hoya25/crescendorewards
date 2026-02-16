
-- Track which purchase milestones a user has been awarded
CREATE TABLE public.purchase_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  milestone_count INT NOT NULL,  -- 1, 5, 10, or 25
  nctr_awarded INT NOT NULL DEFAULT 0,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_count)
);

ALTER TABLE public.purchase_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own milestones"
  ON public.purchase_milestones FOR SELECT
  USING (user_id IN (
    SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
  ));

-- Function: get purchase milestone data for a user
CREATE OR REPLACE FUNCTION public.get_purchase_milestones(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_purchases INT;
  v_total_merch_purchases INT;
  v_milestones_hit INT[];
  v_next_milestone INT;
  v_total_drip_nctr NUMERIC;
  v_milestone_options INT[] := ARRAY[1, 5, 10, 25];
  v_auth_user_id UUID;
BEGIN
  -- Get the auth user id
  SELECT auth_user_id INTO v_auth_user_id
  FROM unified_profiles WHERE id = p_user_id;

  -- Count total completed purchases
  SELECT COUNT(*) INTO v_total_purchases
  FROM purchases
  WHERE user_id = v_auth_user_id AND status = 'completed';

  -- Count merch purchases from eligibility table
  SELECT COUNT(*) INTO v_total_merch_purchases
  FROM merch_purchase_bounty_eligibility
  WHERE user_id = p_user_id;

  -- Get milestones already awarded
  SELECT ARRAY_AGG(milestone_count ORDER BY milestone_count)
  INTO v_milestones_hit
  FROM purchase_milestones
  WHERE user_id = p_user_id;

  v_milestones_hit := COALESCE(v_milestones_hit, ARRAY[]::INT[]);

  -- Determine next milestone
  v_next_milestone := NULL;
  FOR i IN 1..array_length(v_milestone_options, 1) LOOP
    IF NOT (v_milestone_options[i] = ANY(v_milestones_hit)) THEN
      v_next_milestone := v_milestone_options[i];
      EXIT;
    END IF;
  END LOOP;

  -- Calculate total drip NCTR earned from purchases
  SELECT COALESCE(SUM(final_amount), 0) INTO v_total_drip_nctr
  FROM nctr_transactions
  WHERE user_id = p_user_id AND source = 'purchase_drip';

  RETURN jsonb_build_object(
    'total_purchases', v_total_purchases,
    'total_merch_purchases', v_total_merch_purchases,
    'milestones_hit', v_milestones_hit,
    'next_milestone', v_next_milestone,
    'total_drip_nctr', v_total_drip_nctr
  );
END;
$$;

-- Function: check and award milestones after a purchase
CREATE OR REPLACE FUNCTION public.check_purchase_milestones(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_purchases INT;
  v_auth_user_id UUID;
  v_milestone_options INT[] := ARRAY[1, 5, 10, 25];
  v_rewards INT[] := ARRAY[2500, 5000, 10000, 25000];
  v_newly_awarded INT[] := ARRAY[]::INT[];
  v_total_nctr INT := 0;
  v_m INT;
  v_idx INT;
BEGIN
  SELECT auth_user_id INTO v_auth_user_id
  FROM unified_profiles WHERE id = p_user_id;

  SELECT COUNT(*) INTO v_total_purchases
  FROM purchases
  WHERE user_id = v_auth_user_id AND status = 'completed';

  FOR v_idx IN 1..array_length(v_milestone_options, 1) LOOP
    v_m := v_milestone_options[v_idx];
    IF v_total_purchases >= v_m THEN
      -- Try to insert (unique constraint prevents duplicates)
      BEGIN
        INSERT INTO purchase_milestones (user_id, milestone_count, nctr_awarded)
        VALUES (p_user_id, v_m, v_rewards[v_idx]);
        
        v_newly_awarded := array_append(v_newly_awarded, v_m);
        v_total_nctr := v_total_nctr + v_rewards[v_idx];
      EXCEPTION WHEN unique_violation THEN
        -- Already awarded, skip
        NULL;
      END;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'newly_awarded', v_newly_awarded,
    'total_nctr_awarded', v_total_nctr,
    'total_purchases', v_total_purchases
  );
END;
$$;
