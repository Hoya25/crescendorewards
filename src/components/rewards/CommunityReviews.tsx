import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ThumbsUp, MessageSquare, Lightbulb, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MemberReviewForm } from './MemberReviewForm';

interface CommunityReviewsProps {
  rewardId: string;
  rewardTitle: string;
  isAuthenticated: boolean;
}

export function CommunityReviews({ rewardId, rewardTitle, isAuthenticated }: CommunityReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showTipForm, setShowTipForm] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reward-reviews', rewardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_submissions')
        .select('*')
        .eq('reward_id', rewardId)
        .in('status', ['published', 'featured'])
        .in('content_type', ['review', 'testimonial', 'tip'])
        .order('is_featured', { ascending: false })
        .order('submitted_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const reviewItems = reviews.filter(r => r.content_type === 'review');
  const tipItems = reviews.filter(r => r.content_type === 'tip');
  const avgRating = reviewItems.length > 0
    ? reviewItems.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewItems.length
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                What Members Are Saying
              </CardTitle>
              {reviewItems.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("h-4 w-4", s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {avgRating.toFixed(1)} · {reviewItems.length} review{reviewItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            {isAuthenticated && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowTipForm(true)}>
                  <Lightbulb className="h-4 w-4 mr-1" /> Share a Tip
                </Button>
                <Button size="sm" onClick={() => setShowReviewForm(true)}>
                  <Star className="h-4 w-4 mr-1" /> Write a Review
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-medium">Be the first to review this reward</p>
              <p className="text-sm text-muted-foreground">Share your experience and help other members decide.</p>
              {isAuthenticated && (
                <Button onClick={() => setShowReviewForm(true)}>
                  <Star className="h-4 w-4 mr-2" /> Write a Review
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Reviews */}
              {reviewItems.map(review => (
                <div key={review.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={cn("h-4 w-4", s <= (review.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                      <h4 className="font-semibold">{review.title}</h4>
                    </div>
                    {review.thumbnail_url && (
                      <img src={review.thumbnail_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      {review.source_type === 'sponsor' ? '🏢' : review.source_type === 'member' ? '👥' : '👤'}{' '}
                      {review.source_name} · {new Date(review.submitted_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> Helpful ({review.helpful_count || 0})
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Tips */}
              {tipItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-amber-500" /> Member Tips
                  </h3>
                  {tipItems.map(tip => (
                    <div key={tip.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm">{tip.description}</p>
                        {tip.thumbnail_url && (
                          <img src={tip.thumbnail_url} alt="" className="w-20 h-20 rounded-lg object-cover mt-2" />
                        )}
                        <p className="text-xs text-muted-foreground mt-1">— {tip.source_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      <MemberReviewForm
        open={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        rewardId={rewardId}
        rewardTitle={rewardTitle}
        mode="review"
      />

      {/* Tip Form */}
      <MemberReviewForm
        open={showTipForm}
        onClose={() => setShowTipForm(false)}
        rewardId={rewardId}
        rewardTitle={rewardTitle}
        mode="tip"
      />
    </div>
  );
}
