-- Add 'wellness' category to rewards table
ALTER TABLE public.rewards 
DROP CONSTRAINT IF EXISTS rewards_category_check;

ALTER TABLE public.rewards 
ADD CONSTRAINT rewards_category_check 
CHECK (category IN ('alliance_tokens', 'experiences', 'merch', 'gift_cards', 'wellness'));