-- Add delivery configuration to rewards
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS delivery_method text 
  CHECK (delivery_method IN (
    'instant_code',
    'email',
    'wallet_transfer',
    'shipping',
    'platform_delivery',
    'scheduling',
    'manual'
  )) DEFAULT 'email';

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS required_user_data jsonb DEFAULT '["email"]';

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS delivery_instructions text;

-- User delivery profiles table
CREATE TABLE IF NOT EXISTS user_delivery_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  phone text,
  shipping_name text,
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_zip text,
  shipping_country text DEFAULT 'US',
  wallet_address text,
  twitter_handle text,
  instagram_handle text,
  tiktok_handle text,
  twitch_username text,
  discord_username text,
  telegram_handle text,
  youtube_channel text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Add foreign key constraint
ALTER TABLE user_delivery_profiles 
  ADD CONSTRAINT user_delivery_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES unified_profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE user_delivery_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own delivery profile" ON user_delivery_profiles
  FOR SELECT USING (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own delivery profile" ON user_delivery_profiles
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own delivery profile" ON user_delivery_profiles
  FOR UPDATE USING (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can view all delivery profiles" ON user_delivery_profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add delivery tracking to rewards_claims
ALTER TABLE rewards_claims ADD COLUMN IF NOT EXISTS delivery_method text;
ALTER TABLE rewards_claims ADD COLUMN IF NOT EXISTS delivery_data jsonb DEFAULT '{}';
ALTER TABLE rewards_claims ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending' 
  CHECK (delivery_status IN ('pending', 'processing', 'delivered', 'failed'));
ALTER TABLE rewards_claims ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Trigger to update updated_at on user_delivery_profiles
CREATE OR REPLACE FUNCTION update_delivery_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_delivery_profiles_updated_at
  BEFORE UPDATE ON user_delivery_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_profile_updated_at();