-- Permanent removal of Founding 111 per OPUS HANDOFF v15
-- Verified zero rows with non-default values before drop.

DROP FUNCTION IF EXISTS public.get_founding_111_count();
DROP FUNCTION IF EXISTS public.get_founding_111_candidates();
DROP FUNCTION IF EXISTS public.assign_founding_111_candidate(uuid);
DROP FUNCTION IF EXISTS public.assign_founding_111_candidate(uuid, integer);
DROP FUNCTION IF EXISTS public.assign_founding_111(uuid);
DROP FUNCTION IF EXISTS public.approve_founding_111(uuid);
DROP FUNCTION IF EXISTS public.reject_founding_111(uuid);
DROP FUNCTION IF EXISTS public.check_founding_111_qualification(uuid);
DROP FUNCTION IF EXISTS public.get_my_founding_111_status(uuid);
DROP FUNCTION IF EXISTS public.get_my_founding_111_status();

ALTER TABLE public.unified_profiles DROP COLUMN IF EXISTS founding_111;
ALTER TABLE public.unified_profiles DROP COLUMN IF EXISTS founding_111_number;
ALTER TABLE public.unified_profiles DROP COLUMN IF EXISTS founding_111_candidate;
ALTER TABLE public.unified_profiles DROP COLUMN IF EXISTS founding_111_qualified;
ALTER TABLE public.unified_profiles DROP COLUMN IF EXISTS founding_111_approved;
ALTER TABLE public.unified_profiles DROP COLUMN IF EXISTS founding_111_qualified_at;
ALTER TABLE public.unified_profiles DROP COLUMN IF EXISTS founding_111_approved_at;
-- signup_bonus_awarded intentionally NOT dropped — unrelated, load-bearing.