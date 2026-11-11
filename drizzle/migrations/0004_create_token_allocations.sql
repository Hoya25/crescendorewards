CREATE TABLE public.token_allocations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id      uuid NOT NULL REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  amount         numeric NOT NULL CONSTRAINT token_allocations_amount_positive CHECK (amount > 0),
  wallet_address text NOT NULL CONSTRAINT token_allocations_wallet_format CHECK (wallet_address ~ '^0x[a-f0-9]{40}$'),
  lock_months    int NOT NULL CONSTRAINT token_allocations_lock_months_range CHECK (lock_months BETWEEN 12 AND 36),
  release_date   date NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
                 CONSTRAINT token_allocations_status_check CHECK (status IN ('pending','ready','sent','held','failed')),
  batch_id       uuid,
  tx_hash        text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT token_allocations_member_id_key UNIQUE (member_id)
);

CREATE INDEX token_allocations_release_date_status_idx ON public.token_allocations (release_date, status);
CREATE INDEX token_allocations_batch_id_idx ON public.token_allocations (batch_id);

GRANT SELECT ON public.token_allocations TO authenticated;
GRANT ALL ON public.token_allocations TO service_role;

ALTER TABLE public.token_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own allocation"
  ON public.token_allocations FOR SELECT TO authenticated
  USING (member_id = public.current_unified_profile_id());

CREATE POLICY "Admins read all allocations"
  ON public.token_allocations FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

CREATE TRIGGER token_allocations_set_updated_at
  BEFORE UPDATE ON public.token_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE FUNCTION public.token_allocations_normalize() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.wallet_address := lower(NEW.wallet_address);
  NEW.release_date := (NEW.created_at::date + (NEW.lock_months || ' months')::interval)::date;
  RETURN NEW;
END $$;

CREATE TRIGGER token_allocations_normalize
  BEFORE INSERT OR UPDATE OF wallet_address, lock_months
  ON public.token_allocations
  FOR EACH ROW EXECUTE FUNCTION public.token_allocations_normalize();

ALTER TABLE public.unified_profiles
  ADD CONSTRAINT unified_profiles_wallet_address_format
  CHECK (wallet_address ~ '^0x[a-f0-9]{40}$') NOT VALID;