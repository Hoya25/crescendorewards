
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS registered_wallet_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_locked_nctr DECIMAL(20,4) DEFAULT 0;
