-- Create function to get wishlist analytics
CREATE OR REPLACE FUNCTION public.get_wishlist_analytics()
RETURNS TABLE(
  reward_id UUID,
  reward_title TEXT,
  reward_cost INTEGER,
  reward_image TEXT,
  reward_category TEXT,
  wishlist_count BIGINT,
  recent_adds BIGINT,
  avg_days_on_wishlist NUMERIC,
  is_trending BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as reward_id,
    r.title as reward_title,
    r.cost as reward_cost,
    r.image_url as reward_image,
    r.category as reward_category,
    COUNT(w.id) as wishlist_count,
    COUNT(w.id) FILTER (WHERE w.created_at >= NOW() - INTERVAL '7 days') as recent_adds,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - w.created_at)) / 86400), 1) as avg_days_on_wishlist,
    (COUNT(w.id) FILTER (WHERE w.created_at >= NOW() - INTERVAL '7 days') > 2) as is_trending
  FROM rewards r
  LEFT JOIN reward_wishlists w ON w.reward_id = r.id
  WHERE r.is_active = true
  GROUP BY r.id, r.title, r.cost, r.image_url, r.category
  HAVING COUNT(w.id) > 0
  ORDER BY wishlist_count DESC, recent_adds DESC;
END;
$$;