
-- Track merch-specific milestones (first merch purchase award)
CREATE TABLE public.merch_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,  -- e.g. 'first_merch'
  nctr_awarded INT NOT NULL DEFAULT 0,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_key)
);

ALTER TABLE public.merch_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own merch milestones"
  ON public.merch_milestones FOR SELECT
  USING (user_id IN (
    SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
  ));

-- Function: get merch milestone data for a user
CREATE OR REPLACE FUNCTION public.get_merch_milestones(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_merch_purchases INT;
  v_first_merch_completed BOOLEAN;
  v_total_merch_drip_nctr NUMERIC;
BEGIN
  -- Count merch purchases from eligibility table
  SELECT COUNT(*) INTO v_total_merch_purchases
  FROM merch_purchase_bounty_eligibility
  WHERE user_id = p_user_id;

  -- Check if first merch milestone was awarded
  SELECT EXISTS(
    SELECT 1 FROM merch_milestones
    WHERE user_id = p_user_id AND milestone_key = 'first_merch'
  ) INTO v_first_merch_completed;

  -- Calculate total merch drip NCTR earned
  SELECT COALESCE(SUM(final_amount), 0) INTO v_total_merch_drip_nctr
  FROM nctr_transactions
  WHERE user_id = p_user_id AND source = 'merch_drip';

  RETURN jsonb_build_object(
    'total_merch_purchases', v_total_merch_purchases,
    'first_merch_completed', v_first_merch_completed,
    'total_merch_drip_nctr', v_total_merch_drip_nctr
  );
END;
$$;

-- Function: check and award merch milestones after a merch purchase
CREATE OR REPLACE FUNCTION public.check_merch_milestones(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_merch INT;
  v_newly_awarded TEXT[] := ARRAY[]::TEXT[];
  v_total_nctr INT := 0;
BEGIN
  -- Count merch purchases
  SELECT COUNT(*) INTO v_total_merch
  FROM merch_purchase_bounty_eligibility
  WHERE user_id = p_user_id;

  -- Award first merch milestone (5,000 NCTR)
  IF v_total_merch >= 1 THEN
    BEGIN
      INSERT INTO merch_milestones (user_id, milestone_key, nctr_awarded)
      VALUES (p_user_id, 'first_merch', 5000);
      
      v_newly_awarded := array_append(v_newly_awarded, 'first_merch');
      v_total_nctr := v_total_nctr + 5000;
    EXCEPTION WHEN unique_violation THEN
      NULL; -- Already awarded
    END;
  END IF;

  -- Also trigger regular purchase milestone check (merch counts as both)
  PERFORM check_purchase_milestones(p_user_id);

  RETURN jsonb_build_object(
    'newly_awarded', v_newly_awarded,
    'total_nctr_awarded', v_total_nctr,
    'total_merch_purchases', v_total_merch
  );
END;
$$;
