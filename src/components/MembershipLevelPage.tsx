import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
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
  const { profile } = useUnifiedUser();
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [selectedTier, setSelectedTier] = useState<typeof membershipTiers[0] | null>(null);
  const [lockAmount, setLockAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [upgradedTier, setUpgradedTier] = useState<{ old: MembershipTier; new: MembershipTier } | null>(null);

  if (!profile) return null;

  // Get crescendo data from unified profile
  const crescendoData = profile.crescendo_data || {};
  const currentLockedNCTR = crescendoData.locked_nctr || 0;
  const availableNCTR = crescendoData.available_nctr || 0;
  const currentTier = getMembershipTierByNCTR(currentLockedNCTR);
  const nextTier = getNextMembershipTier(currentLockedNCTR);
  const progress = getMembershipProgress(currentLockedNCTR);
  const nctrNeeded = getNCTRNeededForNextLevel(currentLockedNCTR);

  const handleUpgrade = (tier: typeof membershipTiers[0]) => {
    setSelectedTier(tier);
    const needed = Math.max(0, tier.requirement - currentLockedNCTR);
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
        setUpgradedTier({ old: oldTier, new: newTier });
        setShowCelebration(true);
        setTimeout(() => {
          window.location.reload();
        }, 4000); // Reload after celebration
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
            {nextTier && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {nextTier.name}</span>
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
              {nextTier && (
                <Button onClick={() => handleUpgrade(nextTier)} className="gap-2">
                  <Lock className="w-4 h-4" />
                  Upgrade to {nextTier.name}
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
                <h3 className="font-semibold">Earn NCTR</h3>
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
          onClose={() => setShowCelebration(false)}
          newTier={upgradedTier.new}
          oldTier={upgradedTier.old}
        />
      )}
    </div>
  );
}
