-- Table 1: groundball_rewards - Rewards claimable with GROUNDBALL tokens
CREATE TABLE public.groundball_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sponsor TEXT,
  category TEXT CHECK (category IN ('experiences', 'gear', 'apparel', 'services', 'giveback')),
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'any')),
  cost_groundball INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  image_emoji TEXT,
  multiplier_text TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  quantity_available INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 2: gear_vault_items - Contributed and claimable gear
CREATE TABLE public.gear_vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  condition TEXT CHECK (condition IN ('Like New', 'Excellent', 'Good', 'Fair')),
  description TEXT,
  image_url TEXT,
  location_city TEXT,
  location_state TEXT,
  contributor_reward_groundball INTEGER DEFAULT 0,
  contributor_reward_nctr INTEGER DEFAULT 0,
  claim_cost_groundball INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending', 'claimed', 'shipped', 'completed')),
  claimer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 3: gear_vault_config - Configuration for reward amounts by item type
CREATE TABLE public.gear_vault_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT UNIQUE NOT NULL,
  contributor_groundball INTEGER DEFAULT 0,
  contributor_nctr INTEGER DEFAULT 0,
  claim_cost INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.groundball_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_vault_config ENABLE ROW LEVEL SECURITY;

-- groundball_rewards policies
CREATE POLICY "Anyone can read active groundball rewards"
ON public.groundball_rewards
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage groundball rewards"
ON public.groundball_rewards
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- gear_vault_items policies
CREATE POLICY "Anyone can read available gear vault items"
ON public.gear_vault_items
FOR SELECT
USING (status = 'available' OR contributor_id = auth.uid() OR claimer_id = auth.uid());

CREATE POLICY "Authenticated users can contribute gear"
ON public.gear_vault_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Contributors can update their own pending items"
ON public.gear_vault_items
FOR UPDATE
TO authenticated
USING (contributor_id = auth.uid() AND status = 'available')
WITH CHECK (contributor_id = auth.uid());

CREATE POLICY "Authenticated users can claim available items"
ON public.gear_vault_items
FOR UPDATE
TO authenticated
USING (status = 'available' OR claimer_id = auth.uid())
WITH CHECK (true);

CREATE POLICY "Admins can manage all gear vault items"
ON public.gear_vault_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- gear_vault_config policies
CREATE POLICY "Anyone can read active gear vault config"
ON public.gear_vault_config
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage gear vault config"
ON public.gear_vault_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create updated_at triggers
CREATE TRIGGER update_groundball_rewards_updated_at
BEFORE UPDATE ON public.groundball_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_delivery_profile_updated_at();

CREATE TRIGGER update_gear_vault_items_updated_at
BEFORE UPDATE ON public.gear_vault_items
FOR EACH ROW
EXECUTE FUNCTION public.update_delivery_profile_updated_at();

CREATE TRIGGER update_gear_vault_config_updated_at
BEFORE UPDATE ON public.gear_vault_config
FOR EACH ROW
EXECUTE FUNCTION public.update_delivery_profile_updated_at();

-- Create indexes for common queries
CREATE INDEX idx_groundball_rewards_active ON public.groundball_rewards(is_active) WHERE is_active = true;
CREATE INDEX idx_groundball_rewards_category ON public.groundball_rewards(category);
CREATE INDEX idx_groundball_rewards_tier ON public.groundball_rewards(tier);
CREATE INDEX idx_gear_vault_items_status ON public.gear_vault_items(status);
CREATE INDEX idx_gear_vault_items_contributor ON public.gear_vault_items(contributor_id);
CREATE INDEX idx_gear_vault_items_claimer ON public.gear_vault_items(claimer_id);
CREATE INDEX idx_gear_vault_config_item_type ON public.gear_vault_config(item_type);