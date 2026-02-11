import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { Crown } from "lucide-react";

const TIER_COLORS: Record<string, { bar: string; bg: string; border: string }> = {
  bronze: { bar: "bg-amber-700", bg: "from-amber-900/10 to-amber-700/5", border: "border-amber-700/20" },
  silver: { bar: "bg-slate-400", bg: "from-slate-400/10 to-slate-300/5", border: "border-slate-400/20" },
  gold: { bar: "bg-amber-400", bg: "from-amber-400/10 to-yellow-300/5", border: "border-amber-400/20" },
  platinum: { bar: "bg-sky-400", bg: "from-sky-400/10 to-blue-300/5", border: "border-sky-400/20" },
  diamond: { bar: "bg-violet-500", bg: "from-violet-500/10 to-purple-400/5", border: "border-violet-500/20" },
};

export function StatusHero() {
  const { tier, nextTier, progressToNextTier, total360Locked } = useUnifiedUser();

  const tierName = tier?.tier_name?.toLowerCase() || "bronze";
  const colors = TIER_COLORS[tierName] || TIER_COLORS.bronze;
  const isDiamond = !nextTier;

  const nctrRemaining = nextTier
    ? Math.max(0, nextTier.min_nctr_360_locked - total360Locked)
    : 0;

  return (
    <Card className={`border-2 ${colors.border} bg-gradient-to-br ${colors.bg} overflow-hidden`}>
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Tier badge + info */}
          <div className="flex items-center gap-4">
            <div className="text-5xl md:text-6xl shrink-0">
              {tier?.badge_emoji || "🥉"}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Your Crescendo Status
              </p>
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ color: tier?.badge_color }}
              >
                {tier?.display_name || "Bronze"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {total360Locked.toLocaleString()} NCTR locked
              </p>
            </div>
          </div>

          {/* Right: Progress to next tier */}
          <div className="flex-1 max-w-sm w-full">
            {isDiamond ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Crown className="w-5 h-5 text-violet-500" />
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  You've reached the highest tier! 👑
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">
                    {tier?.display_name || "Bronze"} → {nextTier?.display_name}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(progressToNextTier)}%
                  </span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                    style={{ width: `${progressToNextTier}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {total360Locked.toLocaleString()} / {nextTier?.min_nctr_360_locked.toLocaleString()} NCTR
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lock <span className="font-semibold text-foreground">{nctrRemaining.toLocaleString()}</span> more NCTR to reach{" "}
                  <span className="font-semibold" style={{ color: nextTier?.badge_color }}>
                    {nextTier?.display_name}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
