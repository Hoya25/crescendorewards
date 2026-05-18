ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS multiplier_at_submission DECIMAL(4,2);
ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS nctr_amount_calculated INTEGER;
ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS delivery_method TEXT;
ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS fulfillment_timing TEXT;
ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS fulfillment_days INTEGER;
ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS fulfillment_date DATE;
ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS inventory_type TEXT;
ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS inventory_count INTEGER;
ALTER TABLE public.reward_submissions ADD COLUMN IF NOT EXISTS browsing_tags TEXT;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contributor_trust_status TEXT DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contributor_instant_override BOOLEAN DEFAULT FALSE;