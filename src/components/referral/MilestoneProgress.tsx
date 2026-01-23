import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Target, Lock } from 'lucide-react';
import { NCTRLogo } from '@/components/NCTRLogo';
import { useReferralMilestones, ReferralMilestone } from '@/hooks/useReferralMilestones';
import { Skeleton } from '@/components/ui/skeleton';

interface MilestoneProgressProps {
  currentReferrals: number;
  claimedMilestoneIds?: string[];
}

export function MilestoneProgress({ currentReferrals, claimedMilestoneIds = [] }: MilestoneProgressProps) {
  const { data: milestones, isLoading } = useReferralMilestones();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!milestones || milestones.length === 0) {
    return null;
  }

  // Find current and next milestone
  const nextMilestone = milestones.find(m => currentReferrals < m.referral_count);
  const prevMilestone = nextMilestone 
    ? milestones[milestones.indexOf(nextMilestone) - 1]
    : milestones[milestones.length - 1];

  // Calculate progress percentage
  const progressToNext = nextMilestone 
    ? prevMilestone 
      ? ((currentReferrals - prevMilestone.referral_count) / (nextMilestone.referral_count - prevMilestone.referral_count)) * 100
      : (currentReferrals / nextMilestone.referral_count) * 100
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Referral Milestones
        </CardTitle>
        <CardDescription>
          Unlock bonus rewards as you invite more friends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {currentReferrals} of {nextMilestone.referral_count} referrals
              </span>
              <span className="font-medium flex items-center gap-1">
                Next: {nextMilestone.badge_emoji} {nextMilestone.badge_name || `${nextMilestone.referral_count} Friends`}
              </span>
            </div>
            <Progress value={progressToNext} className="h-3" />
          </div>
        )}

        {/* Milestone Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {milestones.map((milestone) => {
            const isAchieved = currentReferrals >= milestone.referral_count;
            const isClaimed = claimedMilestoneIds.includes(milestone.id);
            const isCurrent = milestone === nextMilestone;

            return (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                isAchieved={isAchieved}
                isClaimed={isClaimed}
                isCurrent={isCurrent}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface MilestoneCardProps {
  milestone: ReferralMilestone;
  isAchieved: boolean;
  isClaimed: boolean;
  isCurrent: boolean;
}

function MilestoneCard({ milestone, isAchieved, isClaimed, isCurrent }: MilestoneCardProps) {
  return (
    <div 
      className={`relative p-3 rounded-lg text-center border-2 transition-all ${
        isAchieved 
          ? 'bg-primary/10 border-primary shadow-sm' 
          : isCurrent
            ? 'bg-primary/5 border-primary/50 ring-2 ring-primary/20'
            : 'bg-muted/30 border-transparent'
      }`}
    >
      {/* Badge emoji */}
      <span className="text-2xl">{milestone.badge_emoji || '🎯'}</span>
      
      {/* Count */}
      <p className="text-xs font-medium mt-1">
        {milestone.referral_count} friend{milestone.referral_count !== 1 ? 's' : ''}
      </p>
      
      {/* Badge name */}
      {milestone.badge_name && (
        <p className="text-[10px] text-muted-foreground truncate">
          {milestone.badge_name}
        </p>
      )}
      
      {/* Rewards */}
      <div className="mt-2 space-y-0.5">
        {milestone.nctr_reward > 0 && (
          <p className="text-[10px] text-primary font-medium flex items-center justify-center gap-0.5">
            +{milestone.nctr_reward.toLocaleString()} <NCTRLogo size="xs" />
          </p>
        )}
        {milestone.claims_reward > 0 && (
          <p className="text-[10px] text-amber-600 font-medium">
            +{milestone.claims_reward} Claims
          </p>
        )}
      </div>

      {/* Status indicator */}
      {isAchieved && (
        <Badge 
          variant="default" 
          className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0 h-5"
        >
          <Check className="w-3 h-3 mr-0.5" />
          Done
        </Badge>
      )}
      
      {!isAchieved && !isCurrent && (
        <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
