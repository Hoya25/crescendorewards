-- Add claim price floor setting
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
  ('claim_price_floor', '4', 'Minimum price per claim in dollars (e.g., 4 means $4 per claim minimum)')
ON CONFLICT (setting_key) DO NOTHING;