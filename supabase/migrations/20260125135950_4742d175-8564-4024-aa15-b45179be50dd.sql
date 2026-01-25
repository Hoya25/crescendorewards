-- Create table to manage which benefit types are globally available/active
CREATE TABLE IF NOT EXISTS benefit_type_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'perk',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE benefit_type_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (for UI rendering)
CREATE POLICY "Anyone can read benefit_type_settings"
  ON benefit_type_settings FOR SELECT
  USING (true);

-- Only admins can update (using existing admin check pattern)
CREATE POLICY "Admins can update benefit_type_settings"
  ON benefit_type_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Insert default benefit types
INSERT INTO benefit_type_settings (benefit_key, display_name, description, category, sort_order) VALUES
  ('earning_multiplier', 'Earning Multiplier', 'Members earn multiplied NCTR on activities', 'core', 1),
  ('discount_percent', 'Partner Discount', 'Discount percentage on partner brand purchases', 'core', 2),
  ('claims_allowance', 'Claims Allowance', 'Monthly or yearly reward claim limits', 'core', 3),
  ('priority_support', 'Priority Support', 'Priority customer support access', 'perk', 4),
  ('early_access', 'Early Access', 'Early access to new rewards before general release', 'perk', 5),
  ('vip_events', 'VIP Events', 'Exclusive VIP event invitations', 'perk', 6),
  ('concierge_service', 'Concierge Service', 'Personal concierge assistance', 'perk', 7),
  ('free_shipping', 'Free Shipping', 'Free expedited shipping on physical rewards', 'perk', 8)
ON CONFLICT (benefit_key) DO NOTHING;