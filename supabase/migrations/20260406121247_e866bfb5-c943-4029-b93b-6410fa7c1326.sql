UPDATE unified_profiles SET 
  nctr_locked_points = 750,
  nctr_balance_points = 0,
  current_tier_id = (
    SELECT id FROM status_tiers 
    WHERE min_nctr_360_locked <= 750 
    ORDER BY min_nctr_360_locked DESC 
    LIMIT 1
  ),
  updated_at = NOW()
WHERE email = 'bellanderson@gmail.com';