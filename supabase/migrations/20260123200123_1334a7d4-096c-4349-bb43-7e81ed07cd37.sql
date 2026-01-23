-- Create referral_milestones table for tiered rewards
CREATE TABLE IF NOT EXISTS public.referral_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_count INT NOT NULL UNIQUE,
  nctr_reward INT DEFAULT 0,
  claims_reward INT DEFAULT 0,
  badge_name VARCHAR(100),
  badge_emoji VARCHAR(10),
  title_unlock VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_milestones ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read milestones (public data)
CREATE POLICY "Anyone can view referral milestones"
ON public.referral_milestones
FOR SELECT
USING (true);

-- Seed milestone data
INSERT INTO public.referral_milestones (referral_count, nctr_reward, claims_reward, badge_name, badge_emoji, title_unlock, description) VALUES
(1, 500, 0, NULL, '🎉', NULL, 'First referral reward - you did it!'),
(3, 0, 5, 'Social Butterfly', '🦋', NULL, 'Bonus claims unlocked for being social'),
(5, 1000, 0, 'Connector', '🔗', NULL, 'Connector badge earned - you are bringing people together'),
(10, 2000, 10, 'Networker', '🌐', 'Community Builder', 'Networker badge + exclusive reward entry'),
(25, 5000, 25, 'Ambassador', '👑', 'Crescendo Ambassador', 'Ambassador title unlocked - you are a legend')
ON CONFLICT (referral_count) DO NOTHING;

-- Add milestone tracking to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_milestones_claimed JSONB DEFAULT '[]'::jsonb;

-- Add referral_count column to profiles for easier tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_count INT DEFAULT 0;

-- Create function to check and award milestones
CREATE OR REPLACE FUNCTION public.check_referral_milestones(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_count INT;
  v_claimed_milestones JSONB;
  v_new_milestones JSONB := '[]'::jsonb;
  v_milestone RECORD;
  v_total_nctr_reward INT := 0;
  v_total_claims_reward INT := 0;
BEGIN
  -- Get current referral count
  SELECT COUNT(*) INTO v_referral_count
  FROM referrals
  WHERE referrer_id = p_user_id AND is_paid = true;
  
  -- Update profile referral count
  UPDATE profiles SET referral_count = v_referral_count WHERE id = p_user_id;
  
  -- Get already claimed milestones
  SELECT COALESCE(referral_milestones_claimed, '[]'::jsonb) INTO v_claimed_milestones
  FROM profiles WHERE id = p_user_id;
  
  -- Check each milestone
  FOR v_milestone IN 
    SELECT * FROM referral_milestones 
    WHERE is_active = true 
    AND referral_count <= v_referral_count
    ORDER BY referral_count
  LOOP
    -- If not already claimed
    IF NOT v_claimed_milestones ? v_milestone.id::text THEN
      -- Add to newly unlocked
      v_new_milestones := v_new_milestones || jsonb_build_object(
        'id', v_milestone.id,
        'referral_count', v_milestone.referral_count,
        'nctr_reward', v_milestone.nctr_reward,
        'claims_reward', v_milestone.claims_reward,
        'badge_name', v_milestone.badge_name,
        'badge_emoji', v_milestone.badge_emoji,
        'title_unlock', v_milestone.title_unlock,
        'description', v_milestone.description
      );
      
      -- Track rewards to distribute
      v_total_nctr_reward := v_total_nctr_reward + COALESCE(v_milestone.nctr_reward, 0);
      v_total_claims_reward := v_total_claims_reward + COALESCE(v_milestone.claims_reward, 0);
      
      -- Mark as claimed
      v_claimed_milestones := v_claimed_milestones || jsonb_build_array(v_milestone.id::text);
    END IF;
  END LOOP;
  
  -- Update claimed milestones and distribute rewards
  IF jsonb_array_length(v_new_milestones) > 0 THEN
    UPDATE profiles 
    SET 
      referral_milestones_claimed = v_claimed_milestones,
      locked_nctr = locked_nctr + v_total_nctr_reward,
      claim_balance = claim_balance + v_total_claims_reward
    WHERE id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'referral_count', v_referral_count,
    'new_milestones', v_new_milestones,
    'total_nctr_awarded', v_total_nctr_reward,
    'total_claims_awarded', v_total_claims_reward
  );
END;
$$;

-- Create function to process referral when new user signs up
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referrer_code TEXT,
  p_referred_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_bonus INT := 500;
  v_existing_referral UUID;
BEGIN
  -- Find referrer by code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referrer_code;
  
  -- Validate referrer exists
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;
  
  -- Check for existing referral
  SELECT id INTO v_existing_referral
  FROM referrals
  WHERE referred_id = p_referred_id;
  
  IF v_existing_referral IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;
  
  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_bonus, is_paid)
  VALUES (v_referrer_id, p_referred_id, v_referral_bonus, true);
  
  -- Update referred user's profile
  UPDATE profiles SET referred_by = v_referrer_id WHERE id = p_referred_id;
  
  -- Distribute rewards to BOTH users (360LOCK bonus)
  UPDATE profiles SET locked_nctr = locked_nctr + v_referral_bonus WHERE id = v_referrer_id;
  UPDATE profiles SET locked_nctr = locked_nctr + v_referral_bonus WHERE id = p_referred_id;
  
  -- Check milestones for referrer
  PERFORM check_referral_milestones(v_referrer_id);
  
  -- Create notification for referrer
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_referrer_id,
    'referral_success',
    '🎉 New Referral!',
    'Someone joined using your link! You both earned ' || v_referral_bonus || ' NCTR in 360LOCK.',
    jsonb_build_object('referred_id', p_referred_id, 'bonus', v_referral_bonus)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'bonus', v_referral_bonus
  );
END;
$$;