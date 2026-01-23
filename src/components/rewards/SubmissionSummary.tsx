import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { NCTRLogo } from '@/components/NCTRLogo';
import { Lock, Calendar, DollarSign, FileText, Tag, Package } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { NCTR_RATE, LOCK_OPTIONS } from './LockOptionCards';

interface SubmissionSummaryProps {
  title: string;
  rewardType: string;
  category: string;
  floorAmount: number;
  selectedLockOption: '30' | '90' | '360' | '720';
}

const rewardTypeLabels: Record<string, string> = {
  physical: 'Physical Product',
  digital: 'Digital Good',
  giftcard: 'Gift Card',
  experience: 'Experience',
  nft: 'NFT/Crypto',
  merch: 'Merchandise',
  subscription: 'Subscription',
  other: 'Other',
};

const categoryLabels: Record<string, string> = {
  tech: 'Technology',
  fashion: 'Fashion',
  entertainment: 'Entertainment',
  travel: 'Travel',
  food: 'Food & Dining',
  wellness: 'Wellness',
  opportunity: 'Opportunity',
  other: 'Other',
};

export function SubmissionSummary({
  title,
  rewardType,
  category,
  floorAmount,
  selectedLockOption,
}: SubmissionSummaryProps) {
  const compensation = useMemo(() => {
    const option = LOCK_OPTIONS.find((o) => o.id === selectedLockOption);
    if (!option || floorAmount <= 0) return null;

    const baseNCTR = Math.round(floorAmount / NCTR_RATE);
    const nctrAmount = Math.round(baseNCTR * option.multiplier);
    const dollarValue = nctrAmount * NCTR_RATE;
    const unlockDate = addDays(new Date(), option.days);

    return {
      nctrAmount,
      dollarValue,
      unlockDate,
      lockLabel: option.label,
    };
  }, [floorAmount, selectedLockOption]);

  return (
    <Card className="border-border/50 bg-muted/30">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-4">Your Submission Summary</h3>
        
        <div className="space-y-3">
          {/* Reward Title */}
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-muted-foreground">Reward: </span>
              <span className={`text-sm font-medium ${title ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {title || 'Not set'}
              </span>
            </div>
          </div>

          {/* Reward Type */}
          <div className="flex items-start gap-3">
            <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-muted-foreground">Type: </span>
              <span className={`text-sm font-medium ${rewardType ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {rewardType ? rewardTypeLabels[rewardType] || rewardType : 'Not selected'}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-start gap-3">
            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-muted-foreground">Category: </span>
              <span className={`text-sm font-medium ${category ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {category ? categoryLabels[category] || category : 'Not selected'}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 my-3" />

          {/* Compensation Section */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Your Compensation:</span>
            
            {compensation ? (
              <div className="bg-gradient-to-r from-[#E85D04]/10 via-primary/5 to-[#E85D04]/10 border border-[#E85D04]/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold text-foreground">
                    {compensation.nctrAmount.toLocaleString()}
                  </span>
                  <NCTRLogo size="sm" />
                  <span className="text-sm text-muted-foreground">
                    ({compensation.lockLabel} lock)
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Current Value: <span className="font-medium text-foreground">${compensation.dollarValue.toFixed(2)}</span></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Unlocks: <span className="font-medium text-foreground">{format(compensation.unlockDate, 'MMM d, yyyy')}</span></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground/50">
                <Lock className="h-4 w-4" />
                <span>Set floor amount to see compensation</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
