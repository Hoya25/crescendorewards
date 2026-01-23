-- Add claim_value_usd setting if not exists
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES ('claim_value_usd', '5'::jsonb, 'Dollar value per claim for calculating claims required on reward submissions')
ON CONFLICT (setting_key) DO NOTHING;

-- Add new columns to reward_submissions table
ALTER TABLE reward_submissions
ADD COLUMN IF NOT EXISTS claims_required integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS claim_value_at_submission decimal(10,2);