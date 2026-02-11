import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";

interface UnlockItem {
  emoji: string;
  title: string;
  description: string;
}

const TIER_UNLOCKS: Record<string, UnlockItem[]> = {
  bronze: [
    { emoji: "📸", title: "4 Tier 2 Merch Bounties", description: "Worth up to 1,500 NCTR each" },
    { emoji: "🔍", title: "NCTR Sighting Bounty", description: "Spot NCTR gear in the wild" },
    { emoji: "⭐", title: "Silver-tier Crescendo rewards", description: "Exclusive reward catalog" },
  ],
  silver: [
    { emoji: "🎬", title: "3 Tier 3 Campaign Bounties", description: "Worth up to 3,000 NCTR each" },
    { emoji: "🏆", title: "Multi-Purchase Bonus", description: "3,000 NCTR monthly" },
    { emoji: "💎", title: "Gold-tier premium rewards", description: "Premium reward catalog" },
  ],
  gold: [
    { emoji: "👑", title: "Platinum-tier exclusive rewards", description: "Highest reward quality" },
    { emoji: "🗳️", title: "Enhanced governance voice", description: "Shape the community direction" },
    { emoji: "⭐", title: "VIP experiences and access", description: "Exclusive events and opportunities" },
  ],
  platinum: [
    { emoji: "💎", title: "Diamond-tier ultimate rewards", description: "Top-tier catalog access" },
    { emoji: "🏆", title: "Unlimited reward claims", description: "No more claim limits" },
    { emoji: "👑", title: "White-glove concierge service", description: "Personal support" },
  ],
};

export function NextUnlocks() {
  const { tier, nextTier, total360Locked } = useUnifiedUser();
  const tierName = (tier?.tier_name || "bronze").toLowerCase();
  const isDiamond = !nextTier;

  if (isDiamond) return null;

  const unlocks = TIER_UNLOCKS[tierName] || TIER_UNLOCKS.bronze;
  const nctrRemaining = nextTier
    ? Math.max(0, nextTier.min_nctr_360_locked - total360Locked)
    : 0;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        At {nextTier?.display_name}, You Unlock:
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {unlocks.map((item) => (
          <Card
            key={item.title}
            className="border-dashed border-muted-foreground/20 bg-muted/30"
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="relative shrink-0">
                <span className="text-2xl opacity-60">{item.emoji}</span>
                <Lock className="w-3 h-3 text-muted-foreground absolute -bottom-0.5 -right-0.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
