
ALTER TABLE rewards DROP CONSTRAINT rewards_category_check;
ALTER TABLE rewards ADD CONSTRAINT rewards_category_check CHECK (category = ANY (ARRAY['tokens','alliance_tokens','experiences','merch','gift_cards','wellness','gaming','entertainment','crypto','travel','food','other','opportunity','subscriptions','community']));
