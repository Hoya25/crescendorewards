
-- Create social_shares table
CREATE TABLE public.social_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'farcaster', 'telegram')),
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  month_year TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

-- Users can read their own shares
CREATE POLICY "Users can read own shares"
ON public.social_shares
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own shares
CREATE POLICY "Users can insert own shares"
ON public.social_shares
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Index for efficient monthly lookups
CREATE INDEX idx_social_shares_user_month ON public.social_shares (user_id, month_year);

-- Function: perform a social share
CREATE OR REPLACE FUNCTION public.perform_social_share(p_user_id UUID, p_platform TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month TEXT;
  v_share_count INT;
  v_max_shares INT := 4;
  v_reward INT := 750;
BEGIN
  v_current_month := to_char(now(), 'YYYY-MM');

  -- Validate platform
  IF p_platform NOT IN ('twitter', 'farcaster', 'telegram') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid platform');
  END IF;

  -- Count shares this month
  SELECT COUNT(*) INTO v_share_count
  FROM social_shares
  WHERE user_id = p_user_id AND month_year = v_current_month;

  IF v_share_count >= v_max_shares THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You''ve reached 4 shares this month',
      'shares_this_month', v_share_count,
      'max_shares', v_max_shares
    );
  END IF;

  -- Insert the share
  INSERT INTO social_shares (user_id, platform, month_year)
  VALUES (p_user_id, p_platform, v_current_month);

  -- Award 750 NCTR 360LOCK
  UPDATE profiles
  SET locked_nctr = locked_nctr + v_reward,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'shares_this_month', v_share_count + 1,
    'max_shares', v_max_shares,
    'reward', v_reward,
    'message', 'Share recorded! 750 NCTR earned (360LOCK)'
  );
END;
$$;

-- Function: get share status for current month
CREATE OR REPLACE FUNCTION public.get_share_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month TEXT;
  v_share_count INT;
  v_platforms TEXT[];
BEGIN
  v_current_month := to_char(now(), 'YYYY-MM');

  SELECT COUNT(*), ARRAY_AGG(DISTINCT platform)
  INTO v_share_count, v_platforms
  FROM social_shares
  WHERE user_id = p_user_id AND month_year = v_current_month;

  RETURN jsonb_build_object(
    'shares_this_month', COALESCE(v_share_count, 0),
    'max_shares', 4,
    'platforms_shared', COALESCE(v_platforms, ARRAY[]::TEXT[])
  );
END;
$$;
