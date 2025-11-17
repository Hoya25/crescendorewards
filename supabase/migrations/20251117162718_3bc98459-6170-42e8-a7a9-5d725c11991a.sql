-- Create reward_shares table to track shared rewards
CREATE TABLE IF NOT EXISTS public.reward_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  share_platform TEXT,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  bonus_earned INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.reward_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their own shares
CREATE POLICY "Users can view their own reward shares"
ON public.reward_shares
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own shares
CREATE POLICY "Users can create reward shares"
ON public.reward_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System can update shares (for tracking clicks and conversions)
CREATE POLICY "System can update reward shares"
ON public.reward_shares
FOR UPDATE
USING (true);

-- Add index for better query performance
CREATE INDEX idx_reward_shares_user_id ON public.reward_shares(user_id);
CREATE INDEX idx_reward_shares_reward_id ON public.reward_shares(reward_id);
CREATE INDEX idx_reward_shares_referral_code ON public.reward_shares(referral_code);

-- Create function to track reward share conversions
CREATE OR REPLACE FUNCTION public.track_reward_conversion(
  p_referral_code TEXT,
  p_reward_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_id UUID;
  v_user_id UUID;
  v_bonus_amount INTEGER := 5;
BEGIN
  SELECT id, user_id INTO v_share_id, v_user_id
  FROM reward_shares
  WHERE referral_code = p_referral_code
    AND reward_id = p_reward_id
  ORDER BY shared_at DESC
  LIMIT 1;
  
  IF v_share_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Share not found');
  END IF;
  
  UPDATE reward_shares
  SET conversions = conversions + 1,
      bonus_earned = bonus_earned + v_bonus_amount
  WHERE id = v_share_id;
  
  UPDATE profiles
  SET claim_balance = claim_balance + v_bonus_amount
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bonus_awarded', v_bonus_amount,
    'referrer_id', v_user_id
  );
END;
$$;

-- Create function to get user's share analytics
CREATE OR REPLACE FUNCTION public.get_user_share_analytics()
RETURNS TABLE(
  reward_id UUID,
  reward_title TEXT,
  reward_image TEXT,
  total_shares BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  total_bonus_earned BIGINT,
  conversion_rate NUMERIC,
  last_shared_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.reward_id,
    r.title as reward_title,
    r.image_url as reward_image,
    COUNT(rs.id) as total_shares,
    COALESCE(SUM(rs.clicks), 0) as total_clicks,
    COALESCE(SUM(rs.conversions), 0) as total_conversions,
    COALESCE(SUM(rs.bonus_earned), 0) as total_bonus_earned,
    CASE 
      WHEN SUM(rs.clicks) > 0 THEN ROUND((SUM(rs.conversions)::NUMERIC / SUM(rs.clicks)::NUMERIC) * 100, 2)
      ELSE 0
    END as conversion_rate,
    MAX(rs.shared_at) as last_shared_at
  FROM reward_shares rs
  JOIN rewards r ON r.id = rs.reward_id
  WHERE rs.user_id = auth.uid()
  GROUP BY rs.reward_id, r.title, r.image_url
  ORDER BY total_conversions DESC, total_clicks DESC;
END;
$$;