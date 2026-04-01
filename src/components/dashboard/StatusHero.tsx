import { Card, CardContent } from "@/components/ui/card";
import { useUnifiedUser } from "@/contexts/UnifiedUserContext";
import { Crown } from "lucide-react";
import { DEFAULT_EARNING_MULTIPLIERS } from "@/utils/calculateReward";
import { CrescendoProgressRing } from "@/components/brand/CrescendoLogo";
import { NctrMarketReference } from "@/components/NctrMarketReference";
import { useMemo } from "react";

export function StatusHero() {
  const { tier, nextTier, progressToNextTier, total360Locked, profile, portfolio } = useUnifiedUser();

  const tierName = tier?.tier_name?.toLowerCase() || "bronze";
  const isDiamond = !nextTier;
  const hasNoLocked = total360Locked <= 0;

  // Cross-project point balances from Bounty Hunter sync
  const nctrLockedPoints = Number((profile as any)?.nctr_locked_points) || 0;
  const nctrBalancePoints = Number((profile as any)?.nctr_balance_points) || 0;

  const availableNCTR = (profile?.crescendo_data as any)?.available_nctr || 0;

  const nctrRemaining = nextTier
    ? Math.max(0, nextTier.min_nctr_360_locked - total360Locked)
    : 0;

  const currentMultiplier = (tier as any)?.earning_multiplier ?? DEFAULT_EARNING_MULTIPLIERS[tierName] ?? 1;
  const nextTierName = nextTier?.tier_name?.toLowerCase() || "";
  const nextMultiplier = (nextTier as any)?.earning_multiplier ?? DEFAULT_EARNING_MULTIPLIERS[nextTierName] ?? currentMultiplier;

  // Aggregate lock breakdown from portfolio
  const lockBreakdown = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return null;
    let total360 = 0;
    let total90 = 0;
    for (const w of portfolio) {
      total360 += w.nctr_360_locked || 0;
      total90 += w.nctr_90_locked || 0;
    }
    if (total360 === 0 && total90 === 0) return null;
    return { total360, total90 };
  }, [portfolio]);

  const showLockCards = lockBreakdown && (lockBreakdown.total360 > 0 || lockBreakdown.total90 > 0);

  return (
    <Card className="border border-border-card bg-card-bg overflow-hidden" style={{ borderRadius: 0 }}>
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {/* Left: Current tier */}
          <div className="flex items-center gap-3 shrink-0">
            <CrescendoProgressRing progress={Math.round(progressToNextTier)} tier={tierName as any} size={80} />
            <span className="text-5xl">{tier?.badge_emoji || "🥉"}</span>
            <div>
              <p className="text-xs text-text-body-muted font-medium uppercase tracking-wider">
                Your Crescendo Status
              </p>
              <h2
                className="text-2xl font-bold"
                style={{ color: tier?.badge_color || "#CD7F32", fontFamily: 'var(--font-display, "Barlow Condensed", sans-serif)' }}
              >
                {tier?.display_name || "Bronze"}
              </h2>
              <p className="text-sm text-text-body">
                <span style={{ fontFamily: 'var(--font-mono, "DM Mono", monospace)' }}>
                  {total360Locked.toLocaleString()}
                </span> NCTR locked
                <span className="ml-2 font-semibold text-accent-lime">
                  {currentMultiplier}x earning
                </span>
              </p>
              <NctrMarketReference nctrAmount={total360Locked} />
              {nctrLockedPoints > 0 && (
                <p className="text-[13px] text-muted-foreground">
                  {nctrLockedPoints.toLocaleString()} NCTR locked · {tier?.display_name || "Bronze"} status
                </p>
              )}
              {nctrBalancePoints > 0 && (
                <p className="text-[13px] text-muted-foreground">
                  {nctrBalancePoints.toLocaleString()} NCTR available to lock{' '}
                  <a
                    href="https://bountyhunter.nctr.live/lock"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    →
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Center/Right: Progress */}
          <div className="flex-1 w-full">
            {isDiamond ? (
              <div className="flex items-center gap-2 p-3 bg-violet-500/15 border border-violet-500/25" style={{ borderRadius: 0 }}>
                <Crown className="w-5 h-5 text-violet-400" />
                <p className="text-sm font-semibold text-violet-300">
                  You've reached the highest tier! 👑 {currentMultiplier}x earning on everything.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-text-body-muted">
                    <span style={{ fontFamily: 'var(--font-mono, "DM Mono", monospace)' }}>
                      {total360Locked.toLocaleString()}
                    </span> / {nextTier?.min_nctr_360_locked.toLocaleString()} NCTR locked toward {nextTier?.display_name}
                  </span>
                  <span className="text-text-body-muted">
                    {Math.round(progressToNextTier)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 relative h-3 overflow-hidden bg-elevated-bg" style={{ borderRadius: 0 }}>
                    <div
                      className="h-full transition-all duration-700 bg-accent-lime"
                      style={{ width: `${Math.max(2, progressToNextTier)}%`, borderRadius: 0 }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-lg">{nextTier?.badge_emoji}</span>
                    <span className="text-xs text-text-body-muted font-medium" style={{ fontFamily: 'var(--font-mono, "DM Mono", monospace)' }}>
                      {nctrRemaining.toLocaleString()} to go
                    </span>
                  </div>
                </div>

                {nextMultiplier > currentMultiplier && (
                  <p className="text-xs text-text-body-muted">
                    Reach <span className="font-semibold" style={{ color: nextTier?.badge_color }}>{nextTier?.display_name}</span> for{' '}
                    <span className="font-semibold text-accent-lime">{nextMultiplier}x earnings</span> on everything.
                  </p>
                )}

                {hasNoLocked && availableNCTR > 0 ? (
                  <p className="text-xs text-text-body-muted">
                    You have <span className="font-semibold text-accent-lime">{availableNCTR} NCTR</span> ready to lock. Choose 360LOCK on your next earn to start climbing.
                  </p>
                ) : hasNoLocked ? (
                  <p className="text-xs text-text-body-muted">
                    Every NCTR you lock counts toward your next tier. Higher tier = higher earning multiplier on everything.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Lock breakdown cards */}
        {showLockCards && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
            {lockBreakdown.total360 > 0 && (
              <div
                className="p-3"
                style={{
                  background: '#131313',
                  borderRadius: 0,
                  borderLeft: '2px solid #E2FF6D',
                }}
              >
                <p style={{ fontFamily: 'var(--font-display, "Barlow Condensed", sans-serif)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5A58', marginBottom: '4px' }}>
                  360LOCK
                </p>
                <p style={{ fontFamily: 'var(--font-mono, "DM Mono", monospace)', fontSize: '18px', fontWeight: 500, color: '#E2FF6D' }}>
                  {lockBreakdown.total360.toLocaleString()} <span style={{ fontSize: '11px', color: '#5A5A58' }}>NCTR</span>
                </p>
                <NctrMarketReference nctrAmount={lockBreakdown.total360} />
                <p style={{ fontFamily: 'var(--font-mono, "DM Mono", monospace)', fontSize: '10px', color: '#5A5A58', marginTop: '4px' }}>
                  Builds status
                </p>
              </div>
            )}

            {lockBreakdown.total90 > 0 && (
              <div
                className="p-3"
                style={{
                  background: '#131313',
                  borderRadius: 0,
                }}
              >
                <p style={{ fontFamily: 'var(--font-display, "Barlow Condensed", sans-serif)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5A58', marginBottom: '4px' }}>
                  90LOCK
                </p>
                <p style={{ fontFamily: 'var(--font-mono, "DM Mono", monospace)', fontSize: '18px', fontWeight: 500, color: '#fff' }}>
                  {lockBreakdown.total90.toLocaleString()} <span style={{ fontSize: '11px', color: '#5A5A58' }}>NCTR</span>
                </p>
                <NctrMarketReference nctrAmount={lockBreakdown.total90} />
                <p style={{ fontFamily: 'var(--font-mono, "DM Mono", monospace)', fontSize: '10px', color: '#E2FF6D', marginTop: '4px' }}>
                  Level up to 360LOCK →
                </p>
              </div>
            )}

            {availableNCTR > 0 && (
              <div
                className="p-3"
                style={{
                  background: '#131313',
                  borderRadius: 0,
                }}
              >
                <p style={{ fontFamily: 'var(--font-display, "Barlow Condensed", sans-serif)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5A58', marginBottom: '4px' }}>
                  Available
                </p>
                <p style={{ fontFamily: 'var(--font-mono, "DM Mono", monospace)', fontSize: '18px', fontWeight: 500, color: '#fff' }}>
                  {availableNCTR.toLocaleString()} <span style={{ fontSize: '11px', color: '#5A5A58' }}>NCTR</span>
                </p>
                <NctrMarketReference nctrAmount={availableNCTR} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
