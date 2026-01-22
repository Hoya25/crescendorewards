-- Earning opportunities table
CREATE TABLE IF NOT EXISTS earning_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,
  icon_name text DEFAULT 'Gift',
  icon_url text,
  background_color text DEFAULT '#8B5CF6',
  category text CHECK (category IN ('shopping', 'apps', 'partners', 'community', 'missions')) NOT NULL,
  earn_type text CHECK (earn_type IN ('cashback', 'task', 'referral', 'purchase', 'activity')) NOT NULL,
  earn_potential text,
  cta_text text DEFAULT 'Start Earning',
  cta_url text,
  opens_in_new_tab boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_coming_soon boolean DEFAULT false,
  coming_soon_text text DEFAULT 'Coming Soon',
  sort_order integer DEFAULT 0,
  requirements jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  stats jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_earning_opportunities_category ON earning_opportunities(category);
CREATE INDEX idx_earning_opportunities_active ON earning_opportunities(is_active);
CREATE INDEX idx_earning_opportunities_featured ON earning_opportunities(is_featured);
CREATE INDEX idx_earning_opportunities_sort ON earning_opportunities(sort_order);

-- RLS
ALTER TABLE earning_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active opportunities" ON earning_opportunities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage opportunities" ON earning_opportunities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users au JOIN unified_profiles up ON au.user_id = up.id WHERE up.auth_user_id = auth.uid() AND au.is_active = true)
  );