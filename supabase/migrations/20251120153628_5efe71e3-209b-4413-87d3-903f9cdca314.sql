-- Create reward wishlists table
CREATE TABLE public.reward_wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

-- Enable RLS
ALTER TABLE public.reward_wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own wishlist"
  ON public.reward_wishlists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
  ON public.reward_wishlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist"
  ON public.reward_wishlists
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wishlists"
  ON public.reward_wishlists
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create function for admin to gift reward to member
CREATE OR REPLACE FUNCTION public.admin_gift_reward(
  p_user_id UUID,
  p_reward_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_reward_cost INTEGER;
  v_reward_title TEXT;
  v_current_balance INTEGER;
BEGIN
  v_admin_id := auth.uid();
  
  -- Check if caller is admin
  IF NOT has_role(v_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Get reward details
  SELECT cost, title INTO v_reward_cost, v_reward_title
  FROM rewards
  WHERE id = p_reward_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;
  
  -- Get current user balance
  SELECT claim_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Add claims to user's balance (gift the claims needed for the reward)
  UPDATE profiles
  SET claim_balance = claim_balance + v_reward_cost
  WHERE id = p_user_id;
  
  -- Remove reward from wishlist if it exists
  DELETE FROM reward_wishlists
  WHERE user_id = p_user_id AND reward_id = p_reward_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully gifted ' || v_reward_cost || ' claims for ' || v_reward_title,
    'claims_gifted', v_reward_cost,
    'new_balance', v_current_balance + v_reward_cost
  );
END;
$$;

-- Create function to get user wishlist with reward details
CREATE OR REPLACE FUNCTION public.get_user_wishlist(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  wishlist_id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  reward_id UUID,
  reward_title TEXT,
  reward_cost INTEGER,
  reward_image TEXT,
  reward_category TEXT,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  
  -- If specific user requested, check permissions
  IF p_user_id IS NOT NULL THEN
    -- Allow if requesting own wishlist or if admin
    IF v_caller_id != p_user_id AND NOT has_role(v_caller_id, 'admin') THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    RETURN QUERY
    SELECT 
      w.id as wishlist_id,
      w.user_id,
      p.email as user_email,
      p.full_name as user_name,
      w.reward_id,
      r.title as reward_title,
      r.cost as reward_cost,
      r.image_url as reward_image,
      r.category as reward_category,
      w.notes,
      w.created_at as added_at
    FROM reward_wishlists w
    JOIN profiles p ON p.id = w.user_id
    JOIN rewards r ON r.id = w.reward_id
    WHERE w.user_id = p_user_id
    ORDER BY w.created_at DESC;
  ELSE
    -- If no user specified, admin can see all wishlists
    IF NOT has_role(v_caller_id, 'admin') THEN
      RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
      w.id as wishlist_id,
      w.user_id,
      p.email as user_email,
      p.full_name as user_name,
      w.reward_id,
      r.title as reward_title,
      r.cost as reward_cost,
      r.image_url as reward_image,
      r.category as reward_category,
      w.notes,
      w.created_at as added_at
    FROM reward_wishlists w
    JOIN profiles p ON p.id = w.user_id
    JOIN rewards r ON r.id = w.reward_id
    ORDER BY p.full_name, w.created_at DESC;
  END IF;
END;
$$;