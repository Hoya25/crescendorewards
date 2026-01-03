-- Create function to get public stats for landing page
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_rewards', (SELECT COUNT(*) FROM rewards WHERE is_active = true),
    'total_brands', (SELECT COUNT(*) FROM brands WHERE is_active = true),
    'total_members', (SELECT COUNT(*) FROM profiles),
    'total_claims', (SELECT COUNT(*) FROM rewards_claims),
    'total_rewards_value', (SELECT COALESCE(SUM(cost), 0) FROM rewards WHERE is_active = true)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;