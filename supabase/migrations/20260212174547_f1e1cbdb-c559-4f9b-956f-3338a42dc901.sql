
-- Add contributed reward fields to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS contributed_by UUID REFERENCES unified_profiles(id);
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS is_contributed BOOLEAN DEFAULT false;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS contributor_nctr_per_claim NUMERIC DEFAULT 50;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS contribution_status TEXT DEFAULT 'draft';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS contribution_category TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS delivery_location TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS claim_limit INTEGER DEFAULT 10;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS total_claims INTEGER DEFAULT 0;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create contributed_reward_earnings table
CREATE TABLE IF NOT EXISTS contributed_reward_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES unified_profiles(id) ON DELETE CASCADE NOT NULL,
  claimer_id UUID REFERENCES unified_profiles(id),
  reward_id UUID REFERENCES rewards(id) NOT NULL,
  base_nctr_earned NUMERIC NOT NULL,
  status_multiplier_applied NUMERIC DEFAULT 1.0,
  final_nctr_earned NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contrib_earnings_contributor ON contributed_reward_earnings(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contrib_earnings_reward ON contributed_reward_earnings(reward_id);

ALTER TABLE contributed_reward_earnings ENABLE ROW LEVEL SECURITY;

-- Contributors can see their own earnings
CREATE POLICY "contrib_earnings_select" ON contributed_reward_earnings
  FOR SELECT TO authenticated
  USING (contributor_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

-- Authenticated users can insert (claim triggers insert)
CREATE POLICY "contrib_earnings_insert" ON contributed_reward_earnings
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Add nctr_transactions columns if missing
ALTER TABLE nctr_transactions ADD COLUMN IF NOT EXISTS lock_multiplier_applied NUMERIC DEFAULT 1.0;

-- RLS: contributors can insert their own rewards
CREATE POLICY "contributors_can_insert_rewards" ON rewards
  FOR INSERT TO authenticated
  WITH CHECK (
    is_contributed = true 
    AND contributed_by IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
  );

-- RLS: contributors can update their own contributed rewards
CREATE POLICY "contributors_can_update_own_rewards" ON rewards
  FOR UPDATE TO authenticated
  USING (
    is_contributed = true 
    AND contributed_by IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
  );

-- Create storage bucket for reward images
INSERT INTO storage.buckets (id, name, public) VALUES ('reward-images', 'reward-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view reward images" ON storage.objects
  FOR SELECT USING (bucket_id = 'reward-images');

CREATE POLICY "Authenticated users can upload reward images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reward-images');
