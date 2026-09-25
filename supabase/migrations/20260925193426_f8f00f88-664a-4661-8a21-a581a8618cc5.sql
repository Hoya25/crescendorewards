-- Step 1.1 — BH → Crescendo sync tracking (additive; no behaviour change)
-- Ruling M7 (2026-09-25): BH user_profiles.nctr_locked_points is the ledger of record; Crescendo mirrors it.

ALTER TABLE public.unified_profiles
  ADD COLUMN IF NOT EXISTS last_bh_sync_at timestamptz;

COMMENT ON COLUMN public.unified_profiles.last_bh_sync_at IS
  'source_updated_at of the last BH ledger event applied by receive-lock-request. Server-owned (M7).';

CREATE TABLE IF NOT EXISTS public.bh_sync_events (
  event_id           text PRIMARY KEY,
  bh_user_id         text NOT NULL,
  profile_id         uuid REFERENCES public.unified_profiles(id) ON DELETE SET NULL,
  source_updated_at  timestamptz NOT NULL,
  nctr_locked_points numeric,
  outcome            text NOT NULL
                     CHECK (outcome IN ('applied','stale','rejected','profile_not_found')),
  detail             text,
  received_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bh_sync_events_bh_user_received_idx
  ON public.bh_sync_events (bh_user_id, received_at DESC);

ALTER TABLE public.bh_sync_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bh_sync_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.block_client_financial_writes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text := current_user;
BEGIN
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_TABLE_NAME = 'nctr_transactions' THEN
    RAISE EXCEPTION 'nctr_transactions is server-owned and cannot be written by clients';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'wallet_portfolio' THEN
      NEW.nctr_balance := 0;
      NEW.nctr_360_locked := 0;
      NEW.nctr_90_locked := 0;
      NEW.nctr_unlocked := 0;
      NEW.locks := '[]'::jsonb;
      NEW.sync_source := 'client_registration';
    ELSIF TG_TABLE_NAME = 'unified_profiles' THEN
      NEW.nctr_balance_points := 0;
      NEW.nctr_locked_points := 0;
      NEW.nctr_earned_total := 0;
      NEW.wallet_verified := false;
      NEW.wallet_verified_at := NULL;
      NEW.signup_bonus_awarded := false;
      NEW.tier_override := NULL;
      NEW.tier_override_by := NULL;
      NEW.tier_override_at := NULL;
      -- Claims are dollar-denominated: a client-created profile starts at zero.
      NEW.crescendo_data := (COALESCE(NEW.crescendo_data, '{}'::jsonb) - 'claim_balance')
                            || jsonb_build_object('claims_balance', 0);
    ELSIF TG_TABLE_NAME = 'user_onboarding' THEN
      NEW.onboarding_nctr_awarded := 0;
    ELSIF TG_TABLE_NAME = 'profiles' THEN
      NEW.available_nctr := 0;
      NEW.locked_nctr := 0;
      NEW.total_locked_nctr := 0;
      NEW.claim_balance := 0;
      NEW.has_claimed_signup_bonus := false;
      NEW.wallet_verified_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'wallet_portfolio' THEN
    IF NEW.nctr_balance IS DISTINCT FROM OLD.nctr_balance
       OR NEW.nctr_360_locked IS DISTINCT FROM OLD.nctr_360_locked
       OR NEW.nctr_90_locked IS DISTINCT FROM OLD.nctr_90_locked
       OR NEW.nctr_unlocked IS DISTINCT FROM OLD.nctr_unlocked
       OR NEW.locks IS DISTINCT FROM OLD.locks THEN
      RAISE EXCEPTION 'NCTR balances are server-owned and cannot be modified by clients';
    END IF;
  ELSIF TG_TABLE_NAME = 'unified_profiles' THEN
    IF NEW.nctr_balance_points IS DISTINCT FROM OLD.nctr_balance_points
       OR NEW.nctr_locked_points IS DISTINCT FROM OLD.nctr_locked_points
       OR NEW.nctr_earned_total IS DISTINCT FROM OLD.nctr_earned_total
       OR NEW.current_tier_id IS DISTINCT FROM OLD.current_tier_id
       OR NEW.tier_override IS DISTINCT FROM OLD.tier_override
       OR NEW.tier_override_by IS DISTINCT FROM OLD.tier_override_by
       OR NEW.tier_override_at IS DISTINCT FROM OLD.tier_override_at
       OR NEW.wallet_verified IS DISTINCT FROM OLD.wallet_verified
       OR NEW.wallet_verified_at IS DISTINCT FROM OLD.wallet_verified_at
       OR NEW.signup_bonus_awarded IS DISTINCT FROM OLD.signup_bonus_awarded
       OR NEW.nctr_lock_expires_at IS DISTINCT FROM OLD.nctr_lock_expires_at
       OR NEW.nctr_lock_duration_days IS DISTINCT FROM OLD.nctr_lock_duration_days
       OR NEW.onchain_vesting_synced IS DISTINCT FROM OLD.onchain_vesting_synced
       OR NEW.onchain_vesting_contract IS DISTINCT FROM OLD.onchain_vesting_contract
       OR NEW.bh_user_id IS DISTINCT FROM OLD.bh_user_id
       OR NEW.last_bh_sync_at IS DISTINCT FROM OLD.last_bh_sync_at THEN
      RAISE EXCEPTION 'Balance, tier and wallet-verification fields are server-owned and cannot be modified by clients';
    END IF;

    -- Claims balance lives inside crescendo_data; only server code may change it.
    IF COALESCE(NEW.crescendo_data->>'claims_balance', '')
         IS DISTINCT FROM COALESCE(OLD.crescendo_data->>'claims_balance', '')
       OR COALESCE(NEW.crescendo_data->>'claim_balance', '')
         IS DISTINCT FROM COALESCE(OLD.crescendo_data->>'claim_balance', '') THEN
      RAISE EXCEPTION 'Claims balance is server-owned and cannot be modified by clients';
    END IF;
  ELSIF TG_TABLE_NAME = 'user_onboarding' THEN
    IF NEW.onboarding_nctr_awarded IS DISTINCT FROM OLD.onboarding_nctr_awarded THEN
      RAISE EXCEPTION 'Onboarding awards are server-owned; use award_onboarding_item()';
    END IF;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.available_nctr IS DISTINCT FROM OLD.available_nctr
       OR NEW.locked_nctr IS DISTINCT FROM OLD.locked_nctr
       OR NEW.total_locked_nctr IS DISTINCT FROM OLD.total_locked_nctr
       OR NEW.claim_balance IS DISTINCT FROM OLD.claim_balance
       OR NEW.has_claimed_signup_bonus IS DISTINCT FROM OLD.has_claimed_signup_bonus
       OR NEW.has_status_access_pass IS DISTINCT FROM OLD.has_status_access_pass
       OR NEW.wallet_verified_at IS DISTINCT FROM OLD.wallet_verified_at THEN
      RAISE EXCEPTION 'Balances, claims and wallet verification are server-owned and cannot be modified by clients';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;