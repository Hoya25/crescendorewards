-- Drop the existing category check constraint and recreate it with all valid categories including 'opportunity'
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_category_check;

ALTER TABLE public.rewards ADD CONSTRAINT rewards_category_check CHECK (category IN ('tokens', 'alliance_tokens', 'experiences', 'merch', 'gift_cards', 'wellness', 'gaming', 'entertainment', 'crypto', 'travel', 'food', 'other', 'opportunity'));