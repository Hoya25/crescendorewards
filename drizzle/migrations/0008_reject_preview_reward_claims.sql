ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS is_preview boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.rewards.is_preview IS 'Preview rewards are listed but not claimable; claims are rejected by trg_reject_preview_reward_claim.';

UPDATE public.rewards SET is_preview = true WHERE sponsor_name = 'Kroma Wellness';

CREATE OR REPLACE FUNCTION public.reject_preview_reward_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.rewards r WHERE r.id = NEW.reward_id AND r.is_preview = true) THEN
    RAISE EXCEPTION 'reward_preview: this reward is a preview and is not claimable yet'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_preview_reward_claim() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_reject_preview_reward_claim ON public.rewards_claims;
CREATE TRIGGER trg_reject_preview_reward_claim
BEFORE INSERT OR UPDATE OF reward_id ON public.rewards_claims
FOR EACH ROW EXECUTE FUNCTION public.reject_preview_reward_claim();