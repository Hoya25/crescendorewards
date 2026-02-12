-- Add celebrated boolean to shop_transactions
ALTER TABLE public.shop_transactions 
ADD COLUMN celebrated boolean NOT NULL DEFAULT false;

-- Index for quick lookup of uncelebrated purchases per user
CREATE INDEX idx_shop_transactions_uncelebrated 
ON public.shop_transactions (user_id, celebrated) 
WHERE celebrated = false;