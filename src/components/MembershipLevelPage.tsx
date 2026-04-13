import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CommitmentArc } from '@/components/CommitmentArc';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useTracking } from '@/contexts/ActivityTrackerContext';
import { track } from '@/lib/track';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Zap, Gift, Tag, Check, Lock, Sparkles, Crown, TrendingUp, BarChart3, History, AlertCircle, Wallet, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  membershipTiers, 
  getMembershipTierByNCTR, 
  getNextMembershipTier, 
  getMembershipProgress,
  getNCTRNeededForNextLevel,
  MembershipTier
} from '@/utils/membershipLevels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TierUpgradeCelebration } from './TierUpgradeCelebration';
import { LevelUpModal } from './membership/LevelUpModal';

export function MembershipLevelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackAction } = useTracking();
  const { profile, tier, portfolio, nextTier, progressToNextTier, total360Locked, allTiers, refreshUnifiedProfile } = useUnifiedUser();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [selectedTier, setSelectedTier] = useState<typeof membershipTiers[0] | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [upgradedTier, setUpgradedTier] = useState<{ old: MembershipTier; new: MembershipTier; newLockedAmount: number } | null>(null);
  const [depositInfo, setDepositInfo] = useState<{ total: number; earliestUnlock: string | null }>({ total: 0, earliestUnlock: null });
  const [bhSyncing, setBhSyncing] = useState(false);
  const [bhSyncFailed, setBhSyncFailed] = useState(false);
  const [liveAvailable, setLiveAvailable] = useState<number | null>(null);
  const [liveLocked, setLiveLocked] = useState<number | null>(null);

  // FIX 1 & 3: Fetch fresh balance from BH on mount and when ?from=bh or ?locked=true
  const syncFromBH = useCallback(async () => {
    if (!profile?.email) return;
    setBhSyncing(true);
    setBhSyncFailed(false);
    try {
      const res = await supabase.functions.invoke('bh-status-proxy', {
        body: { action: 'get_user_status', email: profile.email },
      });
      if (res.error) throw new Error('BH sync failed');
      const data = res.data;
      if (data?.error) throw new Error(data.error);
      
      const locked = data?.nctr_locked_points ?? data?.locked ?? null;
      const available = data?.nctr_balance_points ?? data?.available ?? null;
      
      if (locked !== null) setLiveLocked(Number(locked));
      if (available !== null) setLiveAvailable(Number(available));
      
      // Also refresh unified profile to pick up any DB-side updates
      await refreshUnifiedProfile();
    } catch (err) {
      console.warn('BH balance sync failed, using local data:', err);
      setBhSyncFailed(true);
    } finally {
      setBhSyncing(false);
    }
  }, [profile?.email, refreshUnifiedProfile]);

  useEffect(() => {
    if (profile?.email) {
      syncFromBH();
    }
  }, [profile?.email, syncFromBH]);

  // FIX 3: Force refresh when arriving from BH
  useEffect(() => {
    const fromBH = searchParams.get('from') === 'bh' || searchParams.get('locked') === 'true';
    if (fromBH && profile?.email) {
      syncFromBH();
    }
  }, [searchParams, profile?.email, syncFromBH]);

  // Listen for balance refresh events from modal
  useEffect(() => {
    const handler = () => { syncFromBH(); };
    window.addEventListener('nctr-balance-refresh', handler);
    return () => window.removeEventListener('nctr-balance-refresh', handler);
  }, [syncFromBH]);

  // Fetch deposit locked info from profiles
  useEffect(() => {
    if (!profile) return;
    const fetchDepositInfo = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_locked_nctr')
        .eq('id', profile.auth_user_id)
        .single();
      
      const { data: deposits } = await supabase
        .from('nctr_deposits')
        .select('unlocks_at')
        .eq('user_id', profile.auth_user_id)
        .in('status', ['confirmed', 'credited'])
        .order('unlocks_at', { ascending: true })
        .limit(1);
      
      setDepositInfo({
        total: Number(profileData?.total_locked_nctr) || 0,
        earliestUnlock: deposits?.[0]?.unlocks_at || null,
      });
    };
    fetchDepositInfo();
  }, [profile]);

  if (!profile) return null;

  // Use wallet_portfolio data for 360LOCK (primary source of truth)
  const portfolioData = portfolio?.[0];
  const currentLockedNCTR = liveLocked !== null ? liveLocked : total360Locked;
  
  // Calculate available NCTR — prefer live BH data, then portfolio, then local
  const portfolioAvailable = portfolioData?.nctr_unlocked || portfolioData?.nctr_balance || 0;
  const crescendoAvailable = Number(profile?.nctr_balance_points) || 0;
  const availableNCTR = liveAvailable !== null ? liveAvailable : (portfolioData ? portfolioAvailable : crescendoAvailable);
  
  // Get current tier info - use database tier if available, fallback to calculated
  const currentTier = tier 
    ? {
        level: allTiers.findIndex(t => t.id === tier.id),
        name: tier.display_name,
        requirement: tier.min_nctr_360_locked,
        description: '',
        multiplier: 1 + (allTiers.findIndex(t => t.id === tier.id) * 0.1),
        claims: tier.benefits?.[0] || 'Access to rewards',
        discount: allTiers.findIndex(t => t.id === tier.id) * 5,
        benefits: tier.benefits || [],
        nftBadges: [],
        color: tier.badge_color || 'hsl(43 96% 56%)',
        bgColor: tier.badge_color ? `${tier.badge_color}20` : 'hsl(43 96% 96%)'
      }
    : getMembershipTierByNCTR(currentLockedNCTR);
  
  // Create a MembershipTier-compatible object from StatusTier for next tier
  const nextTierDisplay = nextTier ? {
    level: allTiers.findIndex(t => t.id === nextTier.id),
    name: nextTier.display_name,
    requirement: nextTier.min_nctr_360_locked,
    description: '',
    multiplier: 1 + (allTiers.findIndex(t => t.id === nextTier.id) * 0.2),
    claims: nextTier.benefits?.[0] || 'Access to rewards',
    discount: allTiers.findIndex(t => t.id === nextTier.id) * 5,
    benefits: nextTier.benefits || [],
    nftBadges: [],
    color: nextTier.badge_color || 'hsl(180 100% 50%)',
    bgColor: nextTier.badge_color ? `${nextTier.badge_color}20` : 'hsl(180 100% 96%)'
  } : null;
  
  // Calculate progress to next tier
  const progress = progressToNextTier;
  const nctrNeeded = nextTier ? Math.max(0, nextTier.min_nctr_360_locked - currentLockedNCTR) : 0;

  const handleUpgrade = (targetTier: MembershipTier) => {
    setSelectedTier(targetTier);
    setShowLevelUp(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-background/80 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/membership/history')} className="gap-2">
                <History className="w-4 h-4" />
                View History
              </Button>
              <Button variant="outline" onClick={() => navigate('/membership/statistics')} className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Your Status Level Unlocks Everything</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bronze through Diamond — the higher your status, the more you access. 360LOCK your NCTR for 360 days to activate.
          </p>
        </div>

        {/* Current Status Card */}
        <Card className="border-2" style={{ borderColor: currentTier.color }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy style={{ color: currentTier.color }} className="w-6 h-6" />
                  Current Level: {currentTier.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentLockedNCTR.toLocaleString()} NCTR Locked in 360LOCK
                </p>
              </div>
              <Badge 
                className="text-lg px-4 py-2" 
                style={{ backgroundColor: currentTier.color, color: 'white' }}
              >
                {currentTier.multiplier}x
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NCTR Breakdown */}
            {depositInfo.total > 0 && (
              <div className="rounded-lg bg-[#E2FF6D]/5 border border-[#E2FF6D]/20 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-[#E2FF6D]" />
                  <span className="font-medium">Deposited NCTR: {depositInfo.total.toLocaleString()}</span>
                  {depositInfo.earliestUnlock && (
                    <span className="text-xs text-muted-foreground">
                      locked until {new Date(depositInfo.earliestUnlock).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
            {nextTierDisplay && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {nextTierDisplay.name}</span>
                  <span className="font-medium">{nctrNeeded.toLocaleString()} NCTR needed</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Available NCTR</p>
                <p className="text-2xl font-bold">{availableNCTR.toLocaleString()}</p>
                {bhSyncFailed && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#5A5A58', marginTop: '4px' }}>
                    Balance syncs on next login to Bounty Hunter
                  </p>
                )}
              </div>
              {nextTierDisplay && availableNCTR > 0 && (
                <Button onClick={() => handleUpgrade(nextTierDisplay)} className="gap-2">
                  <Lock className="w-4 h-4" />
                  Upgrade to {nextTierDisplay.name}
                </Button>
              )}
              {nextTierDisplay && availableNCTR === 0 && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8A8A88', marginBottom: '6px' }}>
                      Shop and earn on Bounty Hunter
                    </p>
                    <a
                      href="https://bountyhunter.nctr.live"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#E2FF6D',
                        background: 'transparent',
                        border: '1px solid #E2FF6D',
                        borderRadius: 0,
                        padding: '8px 16px',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      EARN MORE →
                    </a>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8A8A88', marginBottom: '6px' }}>
                      Send NCTR directly to level up
                    </p>
                    <button
                      onClick={() => handleUpgrade(nextTierDisplay)}
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#E2FF6D',
                        background: 'transparent',
                        border: '1px solid #E2FF6D',
                        borderRadius: 0,
                        padding: '8px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      SEND NCTR →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* STATUS LEVELS — compact tier table */}
        {(() => {
          const tierData = [
            { name: 'Diamond', nctr: 100000, multiplier: '2.5x', color: '#E2FF6D' },
            { name: 'Platinum', nctr: 40000, multiplier: '1.8x', color: '#E5E4E2' },
            { name: 'Gold', nctr: 15000, multiplier: '1.5x', color: '#FFD700' },
            { name: 'Silver', nctr: 5000, multiplier: '1.25x', color: '#C0C0C0' },
            { name: 'Bronze', nctr: 1000, multiplier: '1.0x', color: '#CD7F32' },
          ];
          const currentTierName = currentTier.name;
          const currentTierIdx = tierData.findIndex(t => t.name === currentTierName);
          const nextTierForProgress = currentTierIdx > 0 ? tierData[currentTierIdx - 1] : null;

          return (
            <div className="space-y-4">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#FFFFFF' }}>
                STATUS LEVELS
              </h2>
              <div>
                {tierData.map((t, idx) => {
                  const isCurrent = t.name === currentTierName;
                  const isAboveCurrent = currentTierIdx === -1 ? true : idx < currentTierIdx;

                  return (
                    <div key={t.name}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#131313',
                          padding: '16px 20px',
                          borderBottom: '1px solid #323232',
                          borderLeft: isCurrent ? `3px solid ${t.color}` : '3px solid transparent',
                          opacity: isAboveCurrent && !isCurrent ? 0.6 : 1,
                        }}
                      >
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', textTransform: 'uppercase' as const, color: t.color, letterSpacing: '0.04em', minWidth: '100px' }}>
                          {t.name}
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '14px', color: '#D9D9D9' }}>
                          {t.nctr.toLocaleString()} NCTR
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '14px', color: '#D9D9D9' }}>
                          {t.multiplier}
                        </span>
                      </div>
                      {isCurrent && nextTierForProgress && (
                        <div style={{ background: '#131313', padding: '4px 20px 12px 26px', borderLeft: `3px solid ${t.color}`, borderBottom: '1px solid #323232' }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#D9D9D9' }}>
                            {currentLockedNCTR.toLocaleString()} / {nextTierForProgress.nctr.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {isCurrent && !nextTierForProgress && (
                        <div style={{ background: '#131313', padding: '4px 20px 12px 26px', borderLeft: `3px solid ${t.color}`, borderBottom: '1px solid #323232' }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#D9D9D9' }}>
                            {currentLockedNCTR.toLocaleString()} — MAX TIER
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* How It Works */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              How Your Status Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Earn NCTR</h3>
                <p className="text-sm text-muted-foreground">Earn through The Garden and bounties — NCTR is the fuel for your status</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Commit via 360LOCK</h3>
                <p className="text-sm text-muted-foreground">Commit NCTR for 360 days to power your status level</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Unlock Benefits</h3>
                <p className="text-sm text-muted-foreground">Enjoy enhanced earning rates, rewards, and exclusive perks at higher status levels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Membership Tiers */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">All Status Levels</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {membershipTiers.map((tier) => {
              const isCurrentTier = tier.level === currentTier.level;
              const isLocked = currentLockedNCTR < tier.requirement;
              const canUpgrade = tier.requirement > currentLockedNCTR && (tier.requirement - currentLockedNCTR) <= availableNCTR;

              return (
                <Card 
                  key={tier.level} 
                  className={cn(
                    "relative overflow-hidden transition-all",
                    isCurrentTier && "border-2 shadow-lg",
                    !isLocked && "hover:shadow-md"
                  )}
                  style={{ borderColor: isCurrentTier ? tier.color : undefined }}
                >
                  {isCurrentTier && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl" style={{ backgroundColor: tier.color }}>
                        Current Level
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Trophy style={{ color: tier.color }} className="w-5 h-5" />
                          {tier.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {tier.requirement.toLocaleString()} NCTR Required
                        </p>
                      </div>
                      <Badge variant="outline" style={{ borderColor: tier.color, color: tier.color }}>
                        {tier.multiplier}x NCTR
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm">{tier.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Gift className="w-4 h-4 text-primary" />
                        <span className="font-medium">{tier.claims}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-medium">{tier.discount}% Partner Discount</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Benefits:</p>
                      <ul className="space-y-1">
                        {tier.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isLocked && canUpgrade && (
                      <Button 
                        onClick={() => handleUpgrade(tier)} 
                        className="w-full gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Lock {(tier.requirement - currentLockedNCTR).toLocaleString()} NCTR
                      </Button>
                    )}
                    {isLocked && !canUpgrade && (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <a
                          href="https://bountyhunter.nctr.live"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            color: '#E2FF6D',
                            background: 'transparent',
                            border: '1px solid #E2FF6D',
                            borderRadius: 0,
                            padding: '8px 12px',
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          EARN MORE →
                        </a>
                        <button
                          onClick={() => handleUpgrade(tier)}
                          style={{
                            flex: 1,
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            color: '#E2FF6D',
                            background: 'transparent',
                            border: '1px solid #E2FF6D',
                            borderRadius: 0,
                            padding: '8px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          SEND NCTR →
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Level Up Modal */}
      <LevelUpModal
        open={showLevelUp}
        onOpenChange={setShowLevelUp}
        targetTierName={selectedTier?.name || ''}
        targetTierRequirement={selectedTier?.requirement || 0}
        currentLocked={currentLockedNCTR}
        availableNCTR={availableNCTR}
        userEmail={profile?.email || ''}
        onBalanceRefresh={syncFromBH}
      />
      {/* Celebration Modal */}
      {upgradedTier && (
        <TierUpgradeCelebration
          isOpen={showCelebration}
          onClose={() => {
            setShowCelebration(false);
            window.location.reload();
          }}
          previousTier={{
            id: String(upgradedTier.old.level),
            tier_name: upgradedTier.old.name.toLowerCase(),
            display_name: upgradedTier.old.name,
            badge_emoji: ['🥉', '🥈', '🥇', '💎', '👑'][upgradedTier.old.level] || '🥉',
            badge_color: upgradedTier.old.color,
            min_nctr_360_locked: upgradedTier.old.requirement,
            max_nctr_360_locked: null,
            benefits: upgradedTier.old.benefits,
            sort_order: upgradedTier.old.level,
            is_active: true,
          }}
          newTier={{
            id: String(upgradedTier.new.level),
            tier_name: upgradedTier.new.name.toLowerCase(),
            display_name: upgradedTier.new.name,
            badge_emoji: ['🥉', '🥈', '🥇', '💎', '👑'][upgradedTier.new.level] || '🥉',
            badge_color: upgradedTier.new.color,
            min_nctr_360_locked: upgradedTier.new.requirement,
            max_nctr_360_locked: null,
            benefits: upgradedTier.new.benefits,
            sort_order: upgradedTier.new.level,
            is_active: true,
          }}
          totalLockedNctr={upgradedTier.newLockedAmount}
          nextTierThreshold={(() => {
            const nextT = membershipTiers.find(t => t.level === upgradedTier.new.level + 1);
            return nextT ? nextT.requirement : null;
          })()}
          nextTierName={(() => {
            const nextT = membershipTiers.find(t => t.level === upgradedTier.new.level + 1);
            return nextT ? nextT.name : null;
          })()}
        />
      )}
    </div>
  );
}
