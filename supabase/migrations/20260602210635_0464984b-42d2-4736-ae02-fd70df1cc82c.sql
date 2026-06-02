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

  SELECT status, version INTO v_parent_status, v_current_version
  FROM reward_submissions
  WHERE id = p_parent_submission_id
    AND user_id = v_user_id
    AND is_latest_version = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parent submission not found or access denied');
  END IF;

  IF v_parent_status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only approved submissions can be updated');
  END IF;

  SELECT * INTO v_original_data
  FROM reward_submissions
  WHERE id = p_parent_submission_id;

  v_new_version := v_current_version + 1;

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

  v_changed_fields := (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each(v_changed_fields)
    WHERE value IS NOT NULL
  );

  UPDATE reward_submissions
  SET is_latest_version = false
  WHERE id = p_parent_submission_id;

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
    version_notes,
    reward_origin,
    floor_usd_amount,
    lock_option,
    multiplier_at_submission
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
    p_version_notes,
    v_original_data.reward_origin,
    v_original_data.floor_usd_amount,
    v_original_data.lock_option,
    v_original_data.multiplier_at_submission
  )
  RETURNING id INTO v_new_submission_id;

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