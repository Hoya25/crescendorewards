-- Add referral 360LOCK allocation setting
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES (
  'referral_360lock_allocation',
  '500',
  'NCTR 360LOCK allocation earned per successful referral'
)
ON CONFLICT (setting_key) DO NOTHING;