
-- Create deposits table (without generated column)
CREATE TABLE IF NOT EXISTS nctr_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_nctr DECIMAL(20,4) NOT NULL,
  tx_hash TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','credited','unlock_eligible','withdrawn')),
  lock_type TEXT DEFAULT '360LOCK',
  deposited_at TIMESTAMPTZ DEFAULT NOW(),
  unlocks_at TIMESTAMPTZ,
  withdrawal_requested_at TIMESTAMPTZ,
  withdrawal_approved_at TIMESTAMPTZ,
  withdrawal_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-set unlocks_at = deposited_at + 360 days via trigger
CREATE OR REPLACE FUNCTION public.set_unlocks_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.unlocks_at := NEW.deposited_at + INTERVAL '360 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_unlocks_at
  BEFORE INSERT OR UPDATE OF deposited_at ON nctr_deposits
  FOR EACH ROW
  EXECUTE FUNCTION set_unlocks_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deposits_wallet ON nctr_deposits(wallet_address);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON nctr_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON nctr_deposits(status);
