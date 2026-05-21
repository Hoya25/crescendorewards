import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { supabase } from "@/lib/supabase";

// TODO(rollback-ref): Remove after live-data NextUnlocks is verified in prod.
// const TIER_UNLOCKS: Record<string, UnlockItem[]> = {
//   bronze: [
//     { emoji: "📸", title: "4 Tier 2 Merch Bounties", description: "Worth up to 1,500 NCTR each" },
//     { emoji: "🔍", title: "NCTR Sighting Bounty", description: "Spot NCTR gear in the wild" },
//     { emoji: "⭐", title: "Silver-tier Crescendo rewards", description: "Exclusive reward catalog" },
//   ],
//   silver: [
//     { emoji: "🎬", title: "3 Tier 3 Campaign Bounties", description: "Worth up to 3,000 NCTR each" },
//     { emoji: "🏆", title: "Multi-Purchase Bonus", description: "3,000 NCTR monthly" },
//     { emoji: "💎", title: "Gold-tier premium rewards", description: "Premium reward catalog" },
//   ],
//   gold: [
//     { emoji: "👑", title: "Platinum-tier exclusive rewards", description: "Highest reward quality" },
//     { emoji: "🗳️", title: "Enhanced governance voice", description: "Shape the community direction" },
//     { emoji: "⭐", title: "VIP experiences and access", description: "Exclusive events and opportunities" },
//   ],
//   platinum: [
//     { emoji: "💎", title: "Diamond-tier ultimate rewards", description: "Top-tier catalog access" },
//     { emoji: "🏆", title: "Unlimited reward claims", description: "No more claim limits" },
//     { emoji: "👑", title: "White-glove concierge service", description: "Personal support" },
//   ],
// };

const TIER_ORDER = ["bronze", "silver", "gold", "platinum", "diamond"] as const;
type TierName = (typeof TIER_ORDER)[number];

interface UnlockReward {
  kind: "reward";
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
}

interface UnlockPartner {
  kind: "partner";
  id: string;
  title: string;
  description: string | null;
  logo_url: string | null;
  category: string | null;
}

type UnlockEntry = UnlockReward | UnlockPartner;

function tierAbove(tier: string): TierName | null {
  const idx = TIER_ORDER.indexOf(tier.toLowerCase() as TierName);
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

async function fetchUnlocksForTier(tierName: string): Promise<UnlockEntry[]> {
  const [rewardsRes, partnersRes] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, title, description, image_url, category")
      .eq("is_active", true)
      .eq("min_status_tier", tierName)
      .limit(3),
    supabase
      .from("alliance_partners")
      .select("id, benefit_title, benefit_description, logo_url, category")
      .eq("is_active", true)
      .eq("is_featured", true)
      .eq("min_tier", tierName)
      .limit(3),
  ]);

  const rewards: UnlockReward[] = (rewardsRes.data || []).map((r: any) => ({
    kind: "reward",
    id: r.id,
    title: r.title,
    description: r.description,
    image_url: r.image_url,
    category: r.category,
  }));

  const partners: UnlockPartner[] = (partnersRes.data || []).map((p: any) => ({
    kind: "partner",
    id: p.id,
    title: p.benefit_title,
    description: p.benefit_description,
    logo_url: p.logo_url,
    category: p.category,
  }));

  // Display order: rewards first, then partners
  return [...rewards, ...partners];
}

export function NextUnlocks() {
  const { tier, nextTier, total360Locked } = useUnifiedUser();
  const tierName = (tier?.tier_name || "bronze").toLowerCase();
  const isDiamond = !nextTier;

  const [unlocks, setUnlocks] = useState<UnlockEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDiamond) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      const targetTier = (nextTier?.tier_name || tierAbove(tierName) || "silver").toLowerCase();

      let entries = await fetchUnlocksForTier(targetTier);

      // Fallback: pull from tier above next if primary tier has no inventory
      if (entries.length === 0) {
        const fallback = tierAbove(targetTier);
        if (fallback) {
          entries = await fetchUnlocksForTier(fallback);
        }
      }

      if (!cancelled) {
        setUnlocks(entries.slice(0, 3));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDiamond, nextTier?.tier_name, tierName]);

  if (isDiamond) return null;

  const nctrRemaining = nextTier
    ? Math.max(0, nextTier.min_nctr_360_locked - total360Locked)
    : 0;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        At {nextTier?.display_name}, You Unlock:
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-dashed border-muted-foreground/20 bg-muted/30 animate-pulse">
              <CardContent className="p-4 h-20" />
            </Card>
          ))}
        </div>
      ) : unlocks.length === 0 ? (
        <Card className="border-dashed border-muted-foreground/20 bg-muted/30">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Your next tier's catalog is rotating. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {unlocks.map((item) => (
            <Card
              key={`${item.kind}-${item.id}`}
              className="border-dashed border-muted-foreground/20 bg-muted/30"
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="relative shrink-0">
                  {item.kind === "reward" && item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-10 h-10 object-cover rounded opacity-60"
                    />
                  ) : item.kind === "partner" && item.logo_url ? (
                    <img
                      src={item.logo_url}
                      alt=""
                      className="w-10 h-10 object-contain opacity-60"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted opacity-60" />
                  )}
                  <Lock className="w-3 h-3 text-muted-foreground absolute -bottom-0.5 -right-0.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-muted-foreground truncate">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mt-1">
                    Unlock at {nextTier?.display_name}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        <span className="font-semibold text-foreground">{nctrRemaining.toLocaleString()}</span> NCTR away from{" "}
        <span className="font-semibold" style={{ color: nextTier?.badge_color }}>
          {nextTier?.display_name}
        </span>
        . Every 360LOCK earn gets you closer.
      </p>
    </section>
  );
}
