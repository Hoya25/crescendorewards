import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useTracking } from '@/contexts/ActivityTrackerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Zap, Gift, Tag, Check, Lock, Sparkles, Crown, TrendingUp, BarChart3, History, AlertCircle } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { cn } from '@/lib/utils';
import { 
  membershipTiers, 
  getMembershipTierByNCTR, 
  getNextMembershipTier, 
  getMembershipProgress,
  getNCTRNeededForNextLevel,
  MembershipTier
} from '@/utils/membershipLevels';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TierUpgradeCelebration } from './TierUpgradeCelebration';

export function MembershipLevelPage() {
  const navigate = useNavigate();
  const { trackAction } = useTracking();
  const { profile, tier, portfolio, nextTier, progressToNextTier, total360Locked, allTiers } = useUnifiedUser();
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [selectedTier, setSelectedTier] = useState<typeof membershipTiers[0] | null>(null);
  const [lockAmount, setLockAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [upgradedTier, setUpgradedTier] = useState<{ old: MembershipTier; new: MembershipTier; newLockedAmount: number } | null>(null);

  if (!profile) return null;

  // Use wallet_portfolio data for 360LOCK (primary source of truth)
  const portfolioData = portfolio?.[0];
  const currentLockedNCTR = total360Locked;
  
  // Calculate available NCTR from portfolio or fallback to crescendo_data
  const portfolioAvailable = portfolioData?.nctr_unlocked || portfolioData?.nctr_balance || 0;
  const crescendoAvailable = (profile.crescendo_data?.available_nctr as number) || 0;
  const availableNCTR = portfolioData ? portfolioAvailable : crescendoAvailable;
  
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
    const needed = Math.max(0, targetTier.requirement - currentLockedNCTR);
    setLockAmount(needed.toString());
    setShowLockDialog(true);
  };

  const handleLockNCTR = async () => {
    if (!lockAmount || parseFloat(lockAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(lockAmount);
    if (amount > availableNCTR) {
      toast.error('Insufficient available NCTR');
      return;
    }

    setProcessing(true);
    trackAction('commit_360lock', { amount });
    try {
      const oldTier = getMembershipTierByNCTR(currentLockedNCTR);
      const newLockedAmount = currentLockedNCTR + amount;
      const newTier = getMembershipTierByNCTR(newLockedAmount);

      const { error } = await supabase
        .from('profiles')
        .update({
          locked_nctr: newLockedAmount,
          available_nctr: availableNCTR - amount,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Record membership history if tier changed
      if (newTier.level > oldTier.level) {
        await supabase.from('membership_history').insert({
          user_id: profile.id,
          tier_level: newTier.level,
          tier_name: newTier.name,
          locked_nctr: newLockedAmount,
          previous_tier_level: oldTier.level,
          previous_tier_name: oldTier.name,
        });
      }

      toast.success(`Successfully locked ${amount} NCTR for 360 days!`);
      setShowLockDialog(false);

      // Check if tier upgraded
      if (newTier.level > oldTier.level) {
        setUpgradedTier({ old: oldTier, new: newTier, newLockedAmount: newLockedAmount });
        setShowCelebration(true);
      } else {
        window.location.reload(); // Refresh to show new progress
      }
    } catch (error: any) {
      console.error('Error locking NCTR:', error);
      toast.error('Failed to lock NCTR. Please try again.');
    } finally {
      setProcessing(false);
    }
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
            <h1 className="text-3xl font-bold">Membership Levels</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Build your membership level by locking NCTR in 360LOCK. Unlock greater rewards, enhanced earning rates, and exclusive benefits.
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
              </div>
              {nextTierDisplay && (
                <Button onClick={() => handleUpgrade(nextTierDisplay)} className="gap-2">
                  <Lock className="w-4 h-4" />
                  Upgrade to {nextTierDisplay.name}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              How Membership Levels Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Get Free Claims</h3>
                <p className="text-sm text-muted-foreground">Earn through The Garden from everyday purchases</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Lock in 360LOCK</h3>
                <p className="text-sm text-muted-foreground">Commit NCTR for 360 days to build your membership level</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Unlock Benefits</h3>
                <p className="text-sm text-muted-foreground">Enjoy enhanced earning rates, rewards, and exclusive perks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Membership Tiers */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">All Membership Levels</h2>
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

                    {isLocked && (
                      <Button 
                        onClick={() => handleUpgrade(tier)} 
                        disabled={!canUpgrade}
                        className="w-full gap-2"
                        variant={canUpgrade ? "default" : "outline"}
                      >
                        <Lock className="w-4 h-4" />
                        {canUpgrade ? `Lock ${(tier.requirement - currentLockedNCTR).toLocaleString()} NCTR` : 'Upgrade'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lock NCTR Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock NCTR for 360 Days</DialogTitle>
            <DialogDescription>
              Lock your NCTR in 360LOCK to upgrade to {selectedTier?.name} membership level.
              Your tokens will be locked for 360 days and contribute to your membership benefits.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lockAmount">Amount to Lock</Label>
              <Input
                id="lockAmount"
                type="number"
                value={lockAmount}
                onChange={(e) => setLockAmount(e.target.value)}
                placeholder="Enter NCTR amount"
              />
              <p className="text-xs text-muted-foreground">
                Available: {availableNCTR.toLocaleString()} NCTR | 
                Minimum needed: {selectedTier ? (selectedTier.requirement - currentLockedNCTR).toLocaleString() : 0} NCTR
              </p>
            </div>

            {selectedTier && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Level:</span>
                    <span className="font-medium">{currentTier.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New Level:</span>
                    <span className="font-medium">{selectedTier.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New Multiplier:</span>
                    <span className="font-medium">{selectedTier.multiplier}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lock Duration:</span>
                    <span className="font-medium">360 days</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={() => setShowConfirmLock(true)} disabled={processing || !lockAmount}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Lock Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmLock}
        onClose={() => setShowConfirmLock(false)}
        onConfirm={() => {
          setShowConfirmLock(false);
          handleLockNCTR();
        }}
        title="Confirm 360LOCK"
        description={`You are about to lock ${lockAmount || '0'} NCTR for 360 days. During this period, your tokens will contribute to your membership level but cannot be withdrawn or transferred. This action cannot be undone.`}
        confirmText={`Lock ${lockAmount || '0'} NCTR`}
        cancelText="Go Back"
        icon={<Lock className="w-5 h-5 text-primary" />}
        isLoading={processing}
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
