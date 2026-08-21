INSERT INTO public.member_groundball_status (member_id, status_tier, selections_used, selections_max, bonus_selections, free_swaps_remaining)
VALUES ('f030b38c-dca6-4d29-a22a-77f221f57dd0', 'gold', 1, 3, 1, 0)
ON CONFLICT (member_id) DO UPDATE SET status_tier='gold', selections_used=1, selections_max=3, bonus_selections=1, free_swaps_remaining=0;