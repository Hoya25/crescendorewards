-- Add token gating fields to rewards table
ALTER TABLE public.rewards
ADD COLUMN token_contract_address text,
ADD COLUMN minimum_token_balance integer DEFAULT 0,
ADD COLUMN token_gated boolean DEFAULT false,
ADD COLUMN token_name text,
ADD COLUMN token_symbol text;

COMMENT ON COLUMN public.rewards.token_contract_address IS 'Base chain contract address for token gating';
COMMENT ON COLUMN public.rewards.minimum_token_balance IS 'Minimum tokens required to claim reward';
COMMENT ON COLUMN public.rewards.token_gated IS 'Whether this reward requires token ownership';
COMMENT ON COLUMN public.rewards.token_name IS 'Display name of required token';
COMMENT ON COLUMN public.rewards.token_symbol IS 'Symbol of required token (e.g., USDC, ETH)';