-- Remove claim_cost columns since access is now status-based
ALTER TABLE public.gear_vault_config DROP COLUMN IF EXISTS claim_cost;
ALTER TABLE public.gear_vault_items DROP COLUMN IF EXISTS claim_cost_groundball;

-- Add a comment explaining the new access model
COMMENT ON TABLE public.gear_vault_items IS 'Gear Vault items - Bronze status or higher required to claim. Contributors earn GROUNDBALL + NCTR based on item type.';