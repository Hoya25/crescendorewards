
ALTER TABLE rewards DROP CONSTRAINT rewards_category_check;
ALTER TABLE rewards ADD CONSTRAINT rewards_category_check CHECK (category = ANY (ARRAY['experiences', 'merch', 'subscriptions', 'community', 'wellness']));
