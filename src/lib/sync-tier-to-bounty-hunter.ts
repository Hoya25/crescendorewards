import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget sync of tier (and referral_code) to Bounty Hunter.
 * Never throws — logs errors silently so it never blocks the caller.
 */
export function syncTierToBountyHunter(
  authUserId: string,
  email: string,
  newTier: string | null
) {
  // Fire and forget — don't await
  supabase.functions
    .invoke("sync-tier-to-bounty-hunter", {
      body: {
        auth_user_id: authUserId,
        email,
        new_tier: newTier,
      },
    })
    .then(({ error }) => {
      if (error) {
        console.warn("[BH Sync] Edge function error:", error.message);
      } else {
        console.log("[BH Sync] Tier synced to Bounty Hunter:", newTier);
      }
    })
    .catch((err) => {
      console.warn("[BH Sync] Network error:", err);
    });
}
