import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Video, Image, FileText, Eye, AlertCircle, Upload } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { MyContentStatsSkeleton, MyContentCardsSkeleton } from '@/components/skeletons/ContentSkeletons';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  published: { label: 'Published', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  featured: { label: 'Featured', className: 'bg-primary/10 text-primary' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
};

const TYPE_ICON: Record<string, typeof Video> = {
  video: Video, tutorial: Video, unboxing: Video,
  image: Image,
  review: FileText, tip: FileText, testimonial: FileText,
};

export default function MyContentPage() {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const userId = profile?.id;

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['my-content', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('content_submissions')
        .select('*')
        .eq('source_id', userId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const publishedCount = submissions.filter(s => s.status === 'published' || s.status === 'featured').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const totalViews = submissions.reduce((sum, s) => sum + (s.view_count || 0), 0);

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Content</h1>
            <p className="text-muted-foreground text-sm">Videos, tutorials, and content you've shared</p>
          </div>
          <Button onClick={() => navigate('/submit-content')}>
            <Plus className="h-4 w-4 mr-2" /> Submit New Content
          </Button>
        </div>

        {isLoading ? (
          <>
            <MyContentStatsSkeleton />
            <MyContentCardsSkeleton count={4} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Published', value: publishedCount },
                { label: 'Pending', value: pendingCount },
                { label: 'Total Views', value: totalViews },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {submissions.length === 0 ? (
              <EmptyState
                icon={Upload}
                title="No content yet"
                description="Share videos, tutorials, and reviews about rewards you love."
                actionLabel="Submit Your First Content"
                actionHref="/submit-content"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {submissions.map(item => {
                  const Icon = TYPE_ICON[item.content_type] || FileText;
                  const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
                  const isRejected = item.status === 'rejected';

                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="h-32 bg-muted flex items-center justify-center relative">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Icon className="h-10 w-10 text-muted-foreground" />
                          )}
                          <Badge className={cn("absolute top-2 right-2 text-xs", statusStyle.className)}>
                            {statusStyle.label}
                          </Badge>
                        </div>

                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>

                          {isRejected && item.rejection_reason && (
                            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded-md p-2">
                              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>{item.rejection_reason}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="capitalize">{item.content_type}</span>
                            {(item.status === 'published' || item.status === 'featured') && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {item.view_count}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.submitted_at).toLocaleDateString()}
                            </p>
                            {isRejected && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => navigate('/submit-content')}
                              >
                                Edit & Resubmit
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
