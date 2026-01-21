-- First, alter the existing sponsors table to add new columns
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES unified_profiles(id);
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS type text DEFAULT 'brand';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS tier text DEFAULT 'community';
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS total_sponsored_value numeric(12,2) DEFAULT 0;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS total_claims integer DEFAULT 0;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';

-- Add check constraint for type (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sponsors_type_check') THEN
    ALTER TABLE sponsors ADD CONSTRAINT sponsors_type_check 
      CHECK (type IN ('brand', 'creator', 'employer', 'individual', 'nonprofit', 'organization'));
  END IF;
END $$;

-- Add check constraint for tier (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sponsors_tier_check') THEN
    ALTER TABLE sponsors ADD CONSTRAINT sponsors_tier_check 
      CHECK (tier IN ('community', 'bronze', 'silver', 'gold', 'platinum', 'mission'));
  END IF;
END $$;

-- Create sponsorship_campaigns table (different from existing sponsored_campaigns)
CREATE TABLE IF NOT EXISTS sponsorship_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid REFERENCES sponsors(id) NOT NULL,
  name text NOT NULL,
  description text,
  campaign_type text CHECK (campaign_type IN ('ongoing', 'limited_time', 'event', 'mission_aligned')) DEFAULT 'ongoing',
  budget_total numeric(12,2),
  budget_spent numeric(12,2) DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  target_mission_engine text,
  target_tiers text[] DEFAULT ARRAY['diamond', 'platinum', 'gold', 'silver', 'bronze'],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS contribution_model text DEFAULT 'contribute';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS sponsor_message text;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS sponsor_cta_text text;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS sponsor_cta_url text;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS cost_per_claim numeric(10,2);
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS revenue_share_percent numeric(5,2);

-- Add check constraint for contribution_model
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rewards_contribution_model_check') THEN
    ALTER TABLE rewards ADD CONSTRAINT rewards_contribution_model_check 
      CHECK (contribution_model IN ('contribute', 'full_sponsor', 'tier_sponsor', 'hybrid', 'revenue_share'));
  END IF;
END $$;

-- Update rewards to reference sponsors table properly
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS linked_sponsor_id uuid REFERENCES sponsors(id);

-- Create sponsorship_transactions table
CREATE TABLE IF NOT EXISTS sponsorship_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid REFERENCES sponsors(id) NOT NULL,
  campaign_id uuid REFERENCES sponsorship_campaigns(id),
  reward_id uuid REFERENCES rewards(id),
  transaction_type text CHECK (transaction_type IN ('claim_sponsored', 'budget_deposit', 'monthly_fee', 'refund')) NOT NULL,
  amount numeric(10,2) NOT NULL,
  member_id uuid REFERENCES unified_profiles(id),
  member_tier text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create sponsor_applications table
CREATE TABLE IF NOT EXISTS sponsor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES unified_profiles(id),
  type text NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  website_url text,
  description text,
  intended_contribution text,
  status text CHECK (status IN ('pending', 'approved', 'rejected', 'more_info')) DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid REFERENCES unified_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sponsors_user ON sponsors(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_type ON sponsors(type);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON sponsors(tier);
CREATE INDEX IF NOT EXISTS idx_rewards_linked_sponsor ON rewards(linked_sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_campaigns_sponsor ON sponsorship_campaigns(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_sponsor ON sponsorship_transactions(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_applications_status ON sponsor_applications(status);

-- Enable RLS on new tables
ALTER TABLE sponsorship_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sponsorship_campaigns

-- Sponsors can view their own campaigns
CREATE POLICY "Sponsors can view own campaigns" ON sponsorship_campaigns
  FOR SELECT USING (sponsor_id IN (
    SELECT id FROM sponsors WHERE user_id IN (
      SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- Sponsors can insert their own campaigns
CREATE POLICY "Sponsors can create own campaigns" ON sponsorship_campaigns
  FOR INSERT WITH CHECK (sponsor_id IN (
    SELECT id FROM sponsors WHERE user_id IN (
      SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- Sponsors can update their own campaigns
CREATE POLICY "Sponsors can update own campaigns" ON sponsorship_campaigns
  FOR UPDATE USING (sponsor_id IN (
    SELECT id FROM sponsors WHERE user_id IN (
      SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- Admins can manage all campaigns
CREATE POLICY "Admins can manage sponsorship campaigns" ON sponsorship_campaigns
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users au 
    JOIN unified_profiles up ON au.user_id = up.id 
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  ));

-- RLS Policies for sponsorship_transactions

-- Sponsors can view their own transactions
CREATE POLICY "Sponsors can view own transactions" ON sponsorship_transactions
  FOR SELECT USING (sponsor_id IN (
    SELECT id FROM sponsors WHERE user_id IN (
      SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
    )
  ));

-- Admins can view all transactions
CREATE POLICY "Admins can view all sponsorship transactions" ON sponsorship_transactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM admin_users au 
    JOIN unified_profiles up ON au.user_id = up.id 
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  ));

-- Service role can insert transactions
CREATE POLICY "Service role can insert transactions" ON sponsorship_transactions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for sponsor_applications

-- Users can create their own applications
CREATE POLICY "Users can create sponsor applications" ON sponsor_applications
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
  ));

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON sponsor_applications
  FOR SELECT USING (user_id IN (
    SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
  ));

-- Admins can manage all applications
CREATE POLICY "Admins can manage sponsor applications" ON sponsor_applications
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users au 
    JOIN unified_profiles up ON au.user_id = up.id 
    WHERE up.auth_user_id = auth.uid() AND au.is_active = true
  ));

-- Add new RLS policies for sponsors table to allow self-management
CREATE POLICY "Sponsors can manage own profile" ON sponsors
  FOR ALL USING (user_id IN (
    SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
  ));

-- Function to calculate member's price for a reward
CREATE OR REPLACE FUNCTION get_member_reward_price(
  p_reward_id uuid,
  p_member_tier text
)
RETURNS jsonb AS $$
DECLARE
  v_reward rewards;
  v_base_price integer;
  v_tier_price integer;
  v_is_free boolean;
  v_discount_percent integer;
BEGIN
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id;
  
  IF v_reward IS NULL THEN
    RETURN jsonb_build_object('error', 'Reward not found');
  END IF;
  
  v_base_price := v_reward.cost;
  
  -- Check tier-specific pricing from status_tier_claims_cost
  IF v_reward.status_tier_claims_cost IS NOT NULL AND v_reward.status_tier_claims_cost ? p_member_tier THEN
    v_tier_price := (v_reward.status_tier_claims_cost ->> p_member_tier)::integer;
  ELSE
    v_tier_price := v_base_price;
  END IF;
  
  v_is_free := (v_tier_price = 0);
  v_discount_percent := CASE WHEN v_base_price > 0 
    THEN ROUND((1 - (v_tier_price::numeric / v_base_price)) * 100)
    ELSE 0 END;
  
  RETURN jsonb_build_object(
    'base_price', v_base_price,
    'your_price', v_tier_price,
    'is_free', v_is_free,
    'discount_percent', v_discount_percent,
    'contribution_model', v_reward.contribution_model,
    'is_sponsored', v_reward.is_sponsored
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get sponsor stats
CREATE OR REPLACE FUNCTION get_sponsor_stats(p_sponsor_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_rewards', (SELECT COUNT(*) FROM rewards WHERE linked_sponsor_id = p_sponsor_id AND is_active = true),
    'total_claims', (SELECT COUNT(*) FROM rewards_claims rc JOIN rewards r ON rc.reward_id = r.id WHERE r.linked_sponsor_id = p_sponsor_id),
    'total_value_sponsored', (SELECT COALESCE(SUM(amount), 0) FROM sponsorship_transactions WHERE sponsor_id = p_sponsor_id AND transaction_type = 'claim_sponsored'),
    'claims_this_month', (SELECT COUNT(*) FROM rewards_claims rc JOIN rewards r ON rc.reward_id = r.id WHERE r.linked_sponsor_id = p_sponsor_id AND rc.claimed_at >= date_trunc('month', now())),
    'active_campaigns', (SELECT COUNT(*) FROM sponsorship_campaigns WHERE sponsor_id = p_sponsor_id AND is_active = true)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;