-- Alliance Partners table
CREATE TABLE alliance_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  short_description TEXT,
  category TEXT NOT NULL,
  benefit_title TEXT NOT NULL,
  benefit_description TEXT NOT NULL,
  monthly_value NUMERIC NOT NULL,
  min_tier TEXT NOT NULL DEFAULT 'bronze',
  is_diamond_exclusive BOOLEAN DEFAULT false,
  slot_cost INTEGER DEFAULT 1,
  activation_type TEXT NOT NULL DEFAULT 'code',
  activation_instructions TEXT,
  activation_url TEXT,
  is_creator_subscription BOOLEAN DEFAULT false,
  creator_platform TEXT,
  creator_channel_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  total_activations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Member Active Benefits table
CREATE TABLE member_active_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES unified_profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES alliance_partners(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  redemption_code TEXT,
  can_swap_after TIMESTAMPTZ,
  slots_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

-- Benefit Activation History table
CREATE TABLE benefit_activation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES unified_profiles(id),
  partner_id UUID NOT NULL REFERENCES alliance_partners(id),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add benefit_slots column to status_tiers
ALTER TABLE status_tiers ADD COLUMN IF NOT EXISTS benefit_slots INTEGER DEFAULT 1;

-- Update benefit slots per tier
UPDATE status_tiers SET benefit_slots = 1 WHERE tier_name = 'bronze';
UPDATE status_tiers SET benefit_slots = 2 WHERE tier_name = 'silver';
UPDATE status_tiers SET benefit_slots = 3 WHERE tier_name = 'gold';
UPDATE status_tiers SET benefit_slots = 4 WHERE tier_name = 'platinum';
UPDATE status_tiers SET benefit_slots = 6 WHERE tier_name = 'diamond';

-- Enable RLS on all new tables
ALTER TABLE alliance_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_active_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_activation_history ENABLE ROW LEVEL SECURITY;

-- Alliance partners are publicly viewable
CREATE POLICY "Alliance partners are publicly viewable"
ON alliance_partners FOR SELECT
USING (is_active = true);

-- Admins can manage alliance partners
CREATE POLICY "Admins can manage alliance partners"
ON alliance_partners FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own active benefits
CREATE POLICY "Users can view their own active benefits"
ON member_active_benefits FOR SELECT
USING (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

-- Users can insert their own active benefits
CREATE POLICY "Users can insert their own active benefits"
ON member_active_benefits FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

-- Users can update their own active benefits
CREATE POLICY "Users can update their own active benefits"
ON member_active_benefits FOR UPDATE
USING (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

-- Users can delete their own active benefits
CREATE POLICY "Users can delete their own active benefits"
ON member_active_benefits FOR DELETE
USING (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

-- Users can view their own benefit history
CREATE POLICY "Users can view their own benefit history"
ON benefit_activation_history FOR SELECT
USING (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

-- Users can insert their own benefit history
CREATE POLICY "Users can insert their own benefit history"
ON benefit_activation_history FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

-- Admins can view all active benefits
CREATE POLICY "Admins can view all active benefits"
ON member_active_benefits FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all benefit history
CREATE POLICY "Admins can view all benefit history"
ON benefit_activation_history FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));