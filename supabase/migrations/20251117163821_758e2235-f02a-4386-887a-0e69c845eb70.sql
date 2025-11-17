-- Add versioning fields to reward_submissions
ALTER TABLE public.reward_submissions
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_submission_id UUID REFERENCES public.reward_submissions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS version_notes TEXT;

-- Create index for faster version queries
CREATE INDEX IF NOT EXISTS idx_reward_submissions_parent_id ON public.reward_submissions(parent_submission_id);
CREATE INDEX IF NOT EXISTS idx_reward_submissions_latest_version ON public.reward_submissions(is_latest_version) WHERE is_latest_version = true;

-- Create a table to track version history and changes
CREATE TABLE IF NOT EXISTS public.reward_submission_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.reward_submissions(id) ON DELETE CASCADE,
  previous_version INTEGER NOT NULL,
  new_version INTEGER NOT NULL,
  changed_fields JSONB NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on changes table
ALTER TABLE public.reward_submission_changes ENABLE ROW LEVEL SECURITY;

-- Users can view changes for their submissions
CREATE POLICY "Users can view their submission changes"
ON public.reward_submission_changes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reward_submissions
    WHERE reward_submissions.id = reward_submission_changes.submission_id
    AND reward_submissions.user_id = auth.uid()
  )
);

-- Admins can view all changes
CREATE POLICY "Admins can view all submission changes"
ON public.reward_submission_changes
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert changes
CREATE POLICY "System can insert submission changes"
ON public.reward_submission_changes
FOR INSERT
WITH CHECK (true);

-- Create function to submit a new version of an approved reward
CREATE OR REPLACE FUNCTION public.submit_reward_version(
  p_parent_submission_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_brand TEXT,
  p_reward_type TEXT,
  p_lock_rate TEXT,
  p_nctr_value INTEGER,
  p_claim_passes_required INTEGER,
  p_stock_quantity INTEGER,
  p_image_url TEXT,
  p_version_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_parent_status TEXT;
  v_current_version INTEGER;
  v_new_version INTEGER;
  v_new_submission_id UUID;
  v_changed_fields JSONB;
  v_original_data RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Verify parent submission exists and belongs to user
  SELECT status, version INTO v_parent_status, v_current_version
  FROM reward_submissions
  WHERE id = p_parent_submission_id
    AND user_id = v_user_id
    AND is_latest_version = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parent submission not found or access denied');
  END IF;
  
  -- Only allow versioning of approved submissions
  IF v_parent_status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only approved submissions can be updated');
  END IF;
  
  -- Get original data for comparison
  SELECT * INTO v_original_data
  FROM reward_submissions
  WHERE id = p_parent_submission_id;
  
  -- Calculate new version number
  v_new_version := v_current_version + 1;
  
  -- Build changed fields JSON
  v_changed_fields := jsonb_build_object(
    'title', CASE WHEN v_original_data.title != p_title THEN jsonb_build_object('old', v_original_data.title, 'new', p_title) ELSE null END,
    'description', CASE WHEN v_original_data.description != p_description THEN jsonb_build_object('old', v_original_data.description, 'new', p_description) ELSE null END,
    'category', CASE WHEN v_original_data.category != p_category THEN jsonb_build_object('old', v_original_data.category, 'new', p_category) ELSE null END,
    'brand', CASE WHEN COALESCE(v_original_data.brand, '') != COALESCE(p_brand, '') THEN jsonb_build_object('old', v_original_data.brand, 'new', p_brand) ELSE null END,
    'nctr_value', CASE WHEN v_original_data.nctr_value != p_nctr_value THEN jsonb_build_object('old', v_original_data.nctr_value, 'new', p_nctr_value) ELSE null END,
    'claim_passes_required', CASE WHEN v_original_data.claim_passes_required != p_claim_passes_required THEN jsonb_build_object('old', v_original_data.claim_passes_required, 'new', p_claim_passes_required) ELSE null END,
    'stock_quantity', CASE WHEN COALESCE(v_original_data.stock_quantity, 0) != COALESCE(p_stock_quantity, 0) THEN jsonb_build_object('old', v_original_data.stock_quantity, 'new', p_stock_quantity) ELSE null END,
    'image_url', CASE WHEN COALESCE(v_original_data.image_url, '') != COALESCE(p_image_url, '') THEN jsonb_build_object('old', v_original_data.image_url, 'new', p_image_url) ELSE null END
  );
  
  -- Remove null fields from changed_fields
  v_changed_fields := (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each(v_changed_fields)
    WHERE value IS NOT NULL
  );
  
  -- Mark current version as not latest
  UPDATE reward_submissions
  SET is_latest_version = false
  WHERE id = p_parent_submission_id;
  
  -- Create new version submission
  INSERT INTO reward_submissions (
    user_id,
    title,
    description,
    category,
    brand,
    reward_type,
    lock_rate,
    nctr_value,
    claim_passes_required,
    stock_quantity,
    image_url,
    status,
    version,
    parent_submission_id,
    is_latest_version,
    version_notes
  ) VALUES (
    v_user_id,
    p_title,
    p_description,
    p_category,
    p_brand,
    p_reward_type,
    p_lock_rate,
    p_nctr_value,
    p_claim_passes_required,
    p_stock_quantity,
    p_image_url,
    'pending',
    v_new_version,
    p_parent_submission_id,
    true,
    p_version_notes
  )
  RETURNING id INTO v_new_submission_id;
  
  -- Record the changes
  INSERT INTO reward_submission_changes (
    submission_id,
    previous_version,
    new_version,
    changed_fields,
    change_summary
  ) VALUES (
    v_new_submission_id,
    v_current_version,
    v_new_version,
    v_changed_fields,
    p_version_notes
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_new_submission_id,
    'version', v_new_version,
    'message', 'New version submitted successfully'
  );
END;
$$;