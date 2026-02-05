-- Add missing columns to shop_transactions
ALTER TABLE shop_transactions 
ADD COLUMN IF NOT EXISTS order_id text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES unified_profiles(id),
ADD COLUMN IF NOT EXISTS nctr_per_dollar_at_time numeric NOT NULL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS credited_at timestamptz,
ADD COLUMN IF NOT EXISTS shopify_data jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create unique constraint on order_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shop_transactions_order_id_key'
  ) THEN
    ALTER TABLE shop_transactions ADD CONSTRAINT shop_transactions_order_id_key UNIQUE (order_id);
  END IF;
END $$;

-- Add store_name to shop_settings if missing
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS store_name text DEFAULT 'NCTR Merch';

-- Add max_nctr_per_order to shop_settings if missing  
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS max_nctr_per_order numeric DEFAULT NULL;

-- Rename minimum_purchase to min_purchase_for_reward if needed (keep backward compatible)
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS min_purchase_for_reward numeric DEFAULT 0;

-- Update min_purchase_for_reward from minimum_purchase
UPDATE shop_settings SET min_purchase_for_reward = COALESCE(minimum_purchase, 0) WHERE min_purchase_for_reward = 0 OR min_purchase_for_reward IS NULL;

-- Make order_number nullable for flexibility
ALTER TABLE shop_transactions ALTER COLUMN order_number DROP NOT NULL;

-- Enable RLS on both tables
ALTER TABLE shop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can view all shop transactions" ON shop_transactions;
DROP POLICY IF EXISTS "Admins can insert shop transactions" ON shop_transactions;
DROP POLICY IF EXISTS "Service role full access to shop transactions" ON shop_transactions;
DROP POLICY IF EXISTS "Users can view own shop transactions" ON shop_transactions;
DROP POLICY IF EXISTS "Admins can manage shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Service role full access to shop settings" ON shop_settings;

-- Admins can see all shop transactions (using admin_users table)
CREATE POLICY "Admins can view all shop transactions"
  ON shop_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id IN (
        SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
      )
      AND admin_users.is_active = true
    )
  );

-- Admins can insert shop transactions (for test button)
CREATE POLICY "Admins can insert shop transactions"
  ON shop_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id IN (
        SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
      )
      AND admin_users.is_active = true
    )
  );

-- Admins can update shop transactions (for linking users)
CREATE POLICY "Admins can update shop transactions"
  ON shop_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id IN (
        SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
      )
      AND admin_users.is_active = true
    )
  );

-- Users can see their own transactions
CREATE POLICY "Users can view own shop transactions"
  ON shop_transactions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM unified_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admin full access to shop settings
CREATE POLICY "Admins can manage shop settings"
  ON shop_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id IN (
        SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
      )
      AND admin_users.is_active = true
    )
  );

-- Anyone can read shop settings (needed for edge function with anon key fallback)
CREATE POLICY "Anyone can read shop settings"
  ON shop_settings FOR SELECT
  USING (true);