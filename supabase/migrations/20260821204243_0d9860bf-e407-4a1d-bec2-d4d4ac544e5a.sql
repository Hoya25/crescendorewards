UPDATE public.member_groundball_status
SET status_tier = 'gold',
    selections_max = 3,
    free_swaps_remaining = 1,
    bonus_selections = 0
WHERE member_id = (SELECT id FROM auth.users WHERE email = 'bellanderson+crescendo-test@gmail.com');