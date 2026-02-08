import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Lightbulb, X } from 'lucide-react';
import { MemberReviewForm } from './MemberReviewForm';

interface PostClaimReviewPromptProps {
  rewardId: string;
  rewardTitle: string;
  onDismiss: () => void;
}

export function PostClaimReviewPrompt({ rewardId, rewardTitle, onDismiss }: PostClaimReviewPromptProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showTipForm, setShowTipForm] = useState(false);

  return (
    <>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">Enjoying your reward?</p>
            <p className="text-sm text-muted-foreground">Share your experience and help other members!</p>
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowReviewForm(true)}>
            <Star className="h-4 w-4 mr-1" /> Write a Review
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTipForm(true)}>
            <Lightbulb className="h-4 w-4 mr-1" /> Share a Tip
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Maybe Later
          </Button>
        </div>
      </div>

      <MemberReviewForm
        open={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        rewardId={rewardId}
        rewardTitle={rewardTitle}
        mode="review"
      />
      <MemberReviewForm
        open={showTipForm}
        onClose={() => setShowTipForm(false)}
        rewardId={rewardId}
        rewardTitle={rewardTitle}
        mode="tip"
      />
    </>
  );
}
