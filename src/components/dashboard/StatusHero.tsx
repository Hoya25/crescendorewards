import { Card, CardContent } from "@/components/ui/card";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { Crown } from "lucide-react";

export function StatusHero() {
  const { tier, nextTier, progressToNextTier, total360Locked, profile } = useUnifiedUser();

  const tierName = tier?.tier_name?.toLowerCase() || "bronze";
  const isDiamond = !nextTier;
  const hasNoLocked = total360Locked <= 0;

  const availableNCTR = (profile?.crescendo_data as any)?.available_nctr || 0;

  const nctrRemaining = nextTier
    ? Math.max(0, nextTier.min_nctr_360_locked - total360Locked)
    : 0;

  return (
    <Card className="border-0 bg-[hsl(0_0%_10%)] text-white overflow-hidden">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {/* Left: Current tier */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-5xl">{tier?.badge_emoji || "🥉"}</span>
            <div>
              <p className="text-xs text-white/50 font-medium uppercase tracking-wider">
                Your Crescendo Status
              </p>
              <h2
                className="text-2xl font-bold"
                style={{ color: tier?.badge_color || "#CD7F32" }}
              >
                {tier?.display_name || "Bronze"}
              </h2>
              <p className="text-sm text-white/60">
                {total360Locked.toLocaleString()} NCTR locked
              </p>
            </div>
          </div>

          {/* Center/Right: Progress */}
          <div className="flex-1 w-full">
            {isDiamond ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-500/15 border border-violet-500/25">
                <Crown className="w-5 h-5 text-violet-400" />
                <p className="text-sm font-semibold text-violet-300">
                  You've reached the highest tier! 👑
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Labels above bar */}
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-white/60">
                    {total360Locked.toLocaleString()} / {nextTier?.min_nctr_360_locked.toLocaleString()} NCTR locked toward {nextTier?.display_name}
                  </span>
                  <span className="text-white/60">
                    {Math.round(progressToNextTier)}%
                  </span>
                </div>

                {/* Progress bar with next tier badge */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-cta"
                      style={{ width: `${Math.max(2, progressToNextTier)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-lg">{nextTier?.badge_emoji}</span>
                    <span className="text-xs text-white/50 font-medium">
                      {nctrRemaining.toLocaleString()} to go
                    </span>
                  </div>
                </div>

                {/* Contextual message */}
                {hasNoLocked && availableNCTR > 0 ? (
                  <p className="text-xs text-white/50">
                    You have <span className="font-semibold text-cta">{availableNCTR} NCTR</span> ready to lock. Choose 360LOCK on your next earn to start climbing.
                  </p>
                ) : (
                  <p className="text-xs text-white/50">
                    Every NCTR you 360LOCK counts toward your next tier. Higher tier = better rewards.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
