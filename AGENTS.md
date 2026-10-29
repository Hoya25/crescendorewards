# Project rules
- Status Perks are queried from active, zero-cost, tier-gated rewards using existing reward columns; this avoids hardcoded inventory and routes fulfillment through the standard reward detail flow.
- Preserve integration identifiers and payload keys during commerce branding changes; only copy and destination URLs change to avoid breaking service contracts.
- Tier benefit copy comes only from the shared resolver (`src/lib/tierBenefits.ts` + `useTierBenefits`, mirrored server-side in `supabase/functions/_shared/tierBenefits.ts`) reading `status_tiers`, `tier_benefits` and active rewards; never hardcode per-tier benefit lists, so every surface, email and MCP tool stays in sync.
- Reward backing is written only through the `back_reward`/`withdraw_backing` RPCs and tallied only by the admin `tally_pick_cycle`; clients read aggregates via `backing_public`/`get_pick_cycles_public`, so the server decides weights.
