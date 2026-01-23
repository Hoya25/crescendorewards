-- Add referral_slug column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_slug VARCHAR(30) UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_slug ON public.profiles(referral_slug);

-- Add link_type tracking to referrals table
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS link_type VARCHAR(20) DEFAULT 'code';

-- Reserved words list for slug validation
CREATE OR REPLACE FUNCTION public.is_reserved_slug(slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN slug = ANY(ARRAY[
    'admin', 'support', 'help', 'signup', 'login', 'join', 'invite', 
    'api', 'app', 'www', 'dashboard', 'settings', 'profile', 'rewards',
    'earn', 'claim', 'claims', 'status', 'nctr', 'crescendo', 'test'
  ]);
END;
$$;

-- Validate slug format
CREATE OR REPLACE FUNCTION public.is_valid_slug(slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- Check length (3-30 chars)
  IF length(slug) < 3 OR length(slug) > 30 THEN
    RETURN FALSE;
  END IF;
  
  -- Check format: lowercase letters, numbers, hyphens only
  IF slug !~ '^[a-z0-9-]+$' THEN
    RETURN FALSE;
  END IF;
  
  -- Cannot start or end with hyphen
  IF slug LIKE '-%' OR slug LIKE '%-' THEN
    RETURN FALSE;
  END IF;
  
  -- Cannot have consecutive hyphens
  IF slug LIKE '%--%' THEN
    RETURN FALSE;
  END IF;
  
  -- Cannot be reserved word
  IF is_reserved_slug(slug) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Check slug availability
CREATE OR REPLACE FUNCTION public.check_slug_availability(p_slug TEXT, p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_normalized_slug TEXT;
  v_existing_user_id UUID;
BEGIN
  v_normalized_slug := lower(trim(p_slug));
  
  -- Validate format first
  IF NOT is_valid_slug(v_normalized_slug) THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'Invalid format. Use 3-30 lowercase letters, numbers, and hyphens.',
      'slug', v_normalized_slug
    );
  END IF;
  
  -- Check if reserved
  IF is_reserved_slug(v_normalized_slug) THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'This name is reserved',
      'slug', v_normalized_slug
    );
  END IF;
  
  -- Check if taken (excluding current user if provided)
  SELECT id INTO v_existing_user_id
  FROM profiles
  WHERE referral_slug = v_normalized_slug
    AND (p_user_id IS NULL OR id != p_user_id);
  
  IF v_existing_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'Already taken',
      'slug', v_normalized_slug
    );
  END IF;
  
  RETURN jsonb_build_object(
    'available', true,
    'slug', v_normalized_slug
  );
END;
$$;

-- Save referral slug
CREATE OR REPLACE FUNCTION public.save_referral_slug(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_normalized_slug TEXT;
  v_check_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  v_normalized_slug := lower(trim(p_slug));
  
  -- Check availability
  v_check_result := check_slug_availability(v_normalized_slug, v_user_id);
  
  IF NOT (v_check_result->>'available')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', v_check_result->>'error'
    );
  END IF;
  
  -- Save the slug
  UPDATE profiles
  SET referral_slug = v_normalized_slug
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'slug', v_normalized_slug
  );
END;
$$;

-- Get referral code by slug (for /join/:slug routing)
CREATE OR REPLACE FUNCTION public.get_referral_code_by_slug(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_code TEXT;
  v_user_id UUID;
BEGIN
  SELECT id, referral_code INTO v_user_id, v_referral_code
  FROM profiles
  WHERE referral_slug = lower(trim(p_slug));
  
  IF v_referral_code IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  
  RETURN jsonb_build_object(
    'found', true,
    'referral_code', v_referral_code,
    'user_id', v_user_id
  );
END;
$$;