
-- ============================================
-- BOUNTIES SYSTEM: Core tables + Merch bounties
-- ============================================

-- 1. Core bounties table
CREATE TABLE IF NOT EXISTS public.bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  nctr_reward NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  image_emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  max_completions INTEGER, -- NULL = unlimited
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Merch bounty fields
  min_status_required TEXT DEFAULT NULL
    CHECK (min_status_required IN ('bronze','silver','gold','platinum','diamond')),
  requires_360lock BOOLEAN DEFAULT false,
  lock_multiplier NUMERIC DEFAULT 3.0,
  requires_purchase BOOLEAN DEFAULT false,
  purchase_product_type TEXT,
  bounty_tier TEXT DEFAULT 'general'
    CHECK (bounty_tier IN ('general','merch_tier1','merch_tier2','merch_tier3','merch_recurring')),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_period TEXT
    CHECK (recurrence_period IN ('daily','weekly','monthly','per_event')),
  
  -- CTA / instructions
  cta_text TEXT DEFAULT 'Claim This Bounty',
  instructions TEXT,
  completion_message TEXT
);

-- 2. Bounty claims table (tracks user completions)
CREATE TABLE IF NOT EXISTS public.bounty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  nctr_earned NUMERIC NOT NULL DEFAULT 0,
  multiplier_applied NUMERIC DEFAULT 1.0,
  locked_to_360 BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','rejected','expired')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bounty_claims_user ON public.bounty_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_bounty_claims_bounty ON public.bounty_claims(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_claims_completed ON public.bounty_claims(completed_at);

-- 3. Merch purchase bounty eligibility
CREATE TABLE IF NOT EXISTS public.merch_purchase_bounty_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  shop_transaction_id UUID,
  product_name TEXT,
  purchase_amount NUMERIC,
  bounties_unlocked INTEGER DEFAULT 0,
  bounties_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merch_eligibility_user
  ON public.merch_purchase_bounty_eligibility(user_id);

-- ============================================
-- RLS Policies
-- ============================================

-- Bounties: public read, admin write
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bounties"
  ON public.bounties FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage bounties"
  ON public.bounties FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Bounty claims: users own, admins all
ALTER TABLE public.bounty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bounty claims"
  ON public.bounty_claims FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own bounty claims"
  ON public.bounty_claims FOR INSERT TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bounty claims"
  ON public.bounty_claims FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Merch purchase eligibility: users own, admins all
ALTER TABLE public.merch_purchase_bounty_eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own merch eligibility"
  ON public.merch_purchase_bounty_eligibility FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage merch eligibility"
  ON public.merch_purchase_bounty_eligibility FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can manage merch eligibility"
  ON public.merch_purchase_bounty_eligibility FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger for bounties
CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON public.bounties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
