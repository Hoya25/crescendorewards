-- Add sponsored reward fields to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS sponsor_logo_url text;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS min_status_tier text;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS status_tier_claims_cost jsonb DEFAULT '{}';

-- Create sponsored campaigns table
CREATE TABLE IF NOT EXISTS sponsored_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  sponsor_name text NOT NULL,
  sponsor_logo_url text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  display_priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on sponsored_campaigns
ALTER TABLE sponsored_campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone can view active campaigns
CREATE POLICY "Anyone can view active campaigns"
ON sponsored_campaigns
FOR SELECT
USING (is_active = true);

-- Admins can manage campaigns
CREATE POLICY "Admins can manage campaigns"
ON sponsored_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Link rewards to campaigns
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES sponsored_campaigns(id);