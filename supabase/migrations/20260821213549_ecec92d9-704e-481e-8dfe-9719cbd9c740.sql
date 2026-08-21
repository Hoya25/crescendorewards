-- 1. handle_history is written only by the claim_handle definer function.
DROP POLICY IF EXISTS "System can insert handle history" ON public.handle_history;
REVOKE INSERT, UPDATE, DELETE ON public.handle_history FROM anon, authenticated;

-- 2. content_submissions: a member submission must be attributed to the caller.
DROP POLICY IF EXISTS "Authenticated users can insert content" ON public.content_submissions;
CREATE POLICY "Members can insert content as themselves"
ON public.content_submissions FOR INSERT TO authenticated
WITH CHECK (
  public.is_current_user_admin()
  OR (
    source_type = 'member'
    AND source_id = public.current_unified_profile_id()
  )
);

-- 3. Contributors may edit descriptive fields only; money, stock, gating and
--    approval state stay server/admin-owned.
CREATE OR REPLACE FUNCTION public.block_contributor_reward_economics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND public.is_current_user_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.cost IS DISTINCT FROM OLD.cost
     OR NEW.claims_required IS DISTINCT FROM OLD.claims_required
     OR NEW.dollar_value IS DISTINCT FROM OLD.dollar_value
     OR NEW.status_tier_claims_cost IS DISTINCT FROM OLD.status_tier_claims_cost
     OR NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity
     OR NEW.min_tier_required IS DISTINCT FROM OLD.min_tier_required
     OR NEW.contribution_status IS DISTINCT FROM OLD.contribution_status
     OR NEW.contributed_by IS DISTINCT FROM OLD.contributed_by
     OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Pricing, stock, tier gating and approval state are admin-owned; submit a new reward version for re-approval';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_contributor_reward_economics ON public.rewards;
CREATE TRIGGER guard_contributor_reward_economics
BEFORE UPDATE ON public.rewards
FOR EACH ROW EXECUTE FUNCTION public.block_contributor_reward_economics();

REVOKE ALL ON FUNCTION public.block_contributor_reward_economics() FROM PUBLIC, anon, authenticated;