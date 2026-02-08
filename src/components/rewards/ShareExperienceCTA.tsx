import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Film, MessageSquare } from 'lucide-react';

interface ShareExperienceCTAProps {
  rewardId: string;
  rewardTitle: string;
  isAuthenticated: boolean;
}

export function ShareExperienceCTA({ rewardId, rewardTitle, isAuthenticated }: ShareExperienceCTAProps) {
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  return (
    <Card className="border-dashed">
      <CardContent className="p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Have this reward? Share your experience!</h3>
        <p className="text-sm text-muted-foreground">
          Help other members by sharing a review, tip, or video
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/submit-content?reward_id=${rewardId}&type=review`)}
            className="gap-1.5"
          >
            <Star className="w-4 h-4" />
            Write a Review
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/submit-content?reward_id=${rewardId}&type=video`)}
            className="gap-1.5"
          >
            <Film className="w-4 h-4" />
            Share a Video
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
