
-- Add source_category to unified_profiles
ALTER TABLE public.unified_profiles ADD COLUMN IF NOT EXISTS source_category text;

-- Create creator_referral_earnings table
CREATE TABLE IF NOT EXISTS public.creator_referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id uuid NOT NULL REFERENCES public.unified_profiles(id) ON DELETE CASCADE,
  referred_profile_id uuid REFERENCES public.unified_profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'signup', 'first_purchase', '5th_purchase', '10th_purchase', 'bronze_reached'
  nctr_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_referral_earnings ENABLE ROW LEVEL SECURITY;

-- Creators can read their own earnings
CREATE POLICY "Users can read own creator referral earnings"
  ON public.creator_referral_earnings
  FOR SELECT
  TO authenticated
  USING (creator_profile_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_creator_referral_earnings_creator ON public.creator_referral_earnings(creator_profile_id);
