-- Gift claims table
CREATE TABLE IF NOT EXISTS claim_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES unified_profiles(id),
  recipient_id uuid REFERENCES unified_profiles(id),
  recipient_email text,
  claims_amount integer NOT NULL CHECK (claims_amount > 0),
  message text,
  gift_code text UNIQUE,
  status text CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')) DEFAULT 'pending',
  purchased_package_id uuid REFERENCES claim_packages(id),
  is_purchased boolean DEFAULT false,
  is_admin_gift boolean DEFAULT false,
  admin_notes text,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_claim_gifts_sender ON claim_gifts(sender_id);
CREATE INDEX idx_claim_gifts_recipient ON claim_gifts(recipient_id);
CREATE INDEX idx_claim_gifts_email ON claim_gifts(recipient_email);
CREATE INDEX idx_claim_gifts_code ON claim_gifts(gift_code);
CREATE INDEX idx_claim_gifts_status ON claim_gifts(status);
CREATE INDEX idx_claim_gifts_admin ON claim_gifts(is_admin_gift);

-- RLS
ALTER TABLE claim_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gifts they sent" ON claim_gifts
  FOR SELECT USING (sender_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view gifts sent to them" ON claim_gifts
  FOR SELECT USING (
    recipient_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
    OR recipient_email IN (SELECT email FROM unified_profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create gifts" ON claim_gifts
  FOR INSERT WITH CHECK (sender_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Recipients can claim gifts" ON claim_gifts
  FOR UPDATE USING (
    recipient_id IN (SELECT id FROM unified_profiles WHERE auth_user_id = auth.uid())
    OR recipient_email IN (SELECT email FROM unified_profiles WHERE auth_user_id = auth.uid())
  );

-- Admin policies
CREATE POLICY "Admins can view all gifts" ON claim_gifts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users au JOIN unified_profiles up ON au.user_id = up.id WHERE up.auth_user_id = auth.uid() AND au.is_active = true)
  );

CREATE POLICY "Admins can create gifts" ON claim_gifts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users au JOIN unified_profiles up ON au.user_id = up.id WHERE up.auth_user_id = auth.uid() AND au.is_active = true)
  );

CREATE POLICY "Admins can update gifts" ON claim_gifts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users au JOIN unified_profiles up ON au.user_id = up.id WHERE up.auth_user_id = auth.uid() AND au.is_active = true)
  );

-- Function to generate unique gift code
CREATE OR REPLACE FUNCTION generate_gift_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN 'GIFT-' || result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to claim a gift
CREATE OR REPLACE FUNCTION claim_gift(p_gift_code text, p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_gift claim_gifts;
  v_user_email text;
  v_auth_user_id uuid;
BEGIN
  -- Get user email and auth_user_id
  SELECT email, auth_user_id INTO v_user_email, v_auth_user_id 
  FROM unified_profiles WHERE id = p_user_id;
  
  -- Find and lock the gift
  SELECT * INTO v_gift FROM claim_gifts 
  WHERE gift_code = p_gift_code 
  AND status = 'pending'
  AND expires_at > now()
  FOR UPDATE;
  
  IF v_gift IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift not found, already claimed, or expired');
  END IF;
  
  -- Check if gift is for specific recipient (skip check for admin gifts with no specific recipient)
  IF v_gift.recipient_id IS NOT NULL AND v_gift.recipient_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'This gift is for someone else');
  END IF;
  
  IF v_gift.recipient_email IS NOT NULL AND lower(v_gift.recipient_email) != lower(v_user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This gift is for a different email address');
  END IF;
  
  -- Update gift status
  UPDATE claim_gifts SET 
    status = 'claimed',
    recipient_id = p_user_id,
    claimed_at = now()
  WHERE id = v_gift.id;
  
  -- Add claims to recipient balance in profiles table
  UPDATE profiles
  SET claim_balance = claim_balance + v_gift.claims_amount,
      updated_at = now()
  WHERE id = v_auth_user_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'claims_received', v_gift.claims_amount,
    'message', v_gift.message,
    'is_admin_gift', v_gift.is_admin_gift
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function for admin to directly credit claims to a user
CREATE OR REPLACE FUNCTION admin_credit_claims(
  p_admin_id uuid,
  p_recipient_id uuid,
  p_claims_amount integer,
  p_message text DEFAULT NULL,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_is_admin boolean;
  v_auth_user_id uuid;
BEGIN
  -- Verify admin status
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = p_admin_id AND is_active = true
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Get auth_user_id for the recipient
  SELECT auth_user_id INTO v_auth_user_id FROM unified_profiles WHERE id = p_recipient_id;
  
  IF v_auth_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient not found');
  END IF;
  
  -- Create gift record (already claimed)
  INSERT INTO claim_gifts (
    sender_id,
    recipient_id,
    claims_amount,
    message,
    gift_code,
    status,
    is_admin_gift,
    admin_notes,
    claimed_at
  ) VALUES (
    p_admin_id,
    p_recipient_id,
    p_claims_amount,
    p_message,
    generate_gift_code(),
    'claimed',
    true,
    p_admin_notes,
    now()
  );
  
  -- Add claims to recipient balance in profiles table
  UPDATE profiles
  SET claim_balance = claim_balance + p_claims_amount,
      updated_at = now()
  WHERE id = v_auth_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'claims_credited', p_claims_amount,
    'recipient_id', p_recipient_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to send a gift from user's balance
CREATE OR REPLACE FUNCTION send_gift_from_balance(
  p_sender_id uuid,
  p_recipient_email text,
  p_claims_amount integer,
  p_message text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_sender_auth_id uuid;
  v_sender_balance integer;
  v_gift_code text;
  v_gift_id uuid;
  v_recipient_id uuid;
BEGIN
  -- Get sender's auth_user_id
  SELECT auth_user_id INTO v_sender_auth_id FROM unified_profiles WHERE id = p_sender_id;
  
  -- Get sender's current balance
  SELECT claim_balance INTO v_sender_balance FROM profiles WHERE id = v_sender_auth_id;
  
  IF v_sender_balance < p_claims_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Check if recipient exists
  SELECT id INTO v_recipient_id FROM unified_profiles WHERE lower(email) = lower(p_recipient_email);
  
  -- Generate gift code
  v_gift_code := generate_gift_code();
  
  -- Deduct from sender's balance
  UPDATE profiles
  SET claim_balance = claim_balance - p_claims_amount,
      updated_at = now()
  WHERE id = v_sender_auth_id;
  
  -- Create gift
  INSERT INTO claim_gifts (
    sender_id,
    recipient_id,
    recipient_email,
    claims_amount,
    message,
    gift_code,
    status,
    is_purchased,
    is_admin_gift
  ) VALUES (
    p_sender_id,
    v_recipient_id,
    p_recipient_email,
    p_claims_amount,
    p_message,
    v_gift_code,
    'pending',
    false,
    false
  ) RETURNING id INTO v_gift_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'gift_id', v_gift_id,
    'gift_code', v_gift_code,
    'claims_sent', p_claims_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to cancel a gift and refund sender
CREATE OR REPLACE FUNCTION cancel_gift(p_gift_id uuid, p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_gift claim_gifts;
  v_sender_auth_id uuid;
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = p_user_id AND is_active = true
  ) INTO v_is_admin;
  
  -- Get the gift
  SELECT * INTO v_gift FROM claim_gifts WHERE id = p_gift_id FOR UPDATE;
  
  IF v_gift IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift not found');
  END IF;
  
  IF v_gift.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Can only cancel pending gifts');
  END IF;
  
  -- Check authorization (sender or admin)
  IF NOT v_is_admin AND v_gift.sender_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Update gift status
  UPDATE claim_gifts SET status = 'cancelled' WHERE id = p_gift_id;
  
  -- Refund sender if not an admin gift and not purchased
  IF NOT v_gift.is_admin_gift AND NOT v_gift.is_purchased THEN
    SELECT auth_user_id INTO v_sender_auth_id FROM unified_profiles WHERE id = v_gift.sender_id;
    
    UPDATE profiles
    SET claim_balance = claim_balance + v_gift.claims_amount,
        updated_at = now()
    WHERE id = v_sender_auth_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'refunded', NOT v_gift.is_admin_gift AND NOT v_gift.is_purchased);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get gift stats for admin
CREATE OR REPLACE FUNCTION get_gift_stats()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'total_gifts', (SELECT COUNT(*) FROM claim_gifts),
    'total_claims_gifted', (SELECT COALESCE(SUM(claims_amount), 0) FROM claim_gifts),
    'pending_gifts', (SELECT COUNT(*) FROM claim_gifts WHERE status = 'pending'),
    'claimed_gifts', (SELECT COUNT(*) FROM claim_gifts WHERE status = 'claimed'),
    'expired_gifts', (SELECT COUNT(*) FROM claim_gifts WHERE status = 'expired'),
    'admin_gifts', (SELECT COUNT(*) FROM claim_gifts WHERE is_admin_gift = true),
    'user_gifts', (SELECT COUNT(*) FROM claim_gifts WHERE is_admin_gift = false),
    'admin_claims_gifted', (SELECT COALESCE(SUM(claims_amount), 0) FROM claim_gifts WHERE is_admin_gift = true),
    'user_claims_gifted', (SELECT COALESCE(SUM(claims_amount), 0) FROM claim_gifts WHERE is_admin_gift = false)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;