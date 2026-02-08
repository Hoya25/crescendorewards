import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Plus, Video, Image, FileText, Eye, Link as LinkIcon, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

type ContentFormat = 'video' | 'image' | 'written';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  published: { label: 'Published', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  featured: { label: 'Featured', className: 'bg-primary/10 text-primary' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
};

const TYPE_ICON: Record<string, typeof Video> = {
  video: Video,
  tutorial: Video,
  unboxing: Video,
  image: Image,
  review: FileText,
  tip: FileText,
  testimonial: FileText,
};

const VIDEO_TYPES = [
  { value: 'tutorial', label: 'Product Demo / Tutorial' },
  { value: 'testimonial', label: 'Behind the Scenes' },
  { value: 'review', label: 'Testimonial / Review' },
  { value: 'unboxing', label: 'Unboxing' },
  { value: 'tip', label: 'Tips & Tricks' },
];

interface SponsorContentTabProps {
  sponsorName: string;
  sponsorId: string;
  sponsoredRewards: { id: string; title: string }[];
}

export function SponsorContentTab({ sponsorName, sponsorId, sponsoredRewards }: SponsorContentTabProps) {
  const { profile } = useUnifiedUser();
  const queryClient = useQueryClient();
  const userId = profile?.id;

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [format, setFormat] = useState<ContentFormat | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [contentType, setContentType] = useState('');
  const [rewardId, setRewardId] = useState<string>('');
  const [requestFeature, setRequestFeature] = useState(false);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['sponsor-content', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('content_submissions')
        .select('*')
        .eq('source_type', 'sponsor')
        .eq('source_id', userId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase.from('content_submissions').insert({
        title,
        description: requestFeature
          ? `${description}\n\n[SPONSOR REQUEST: Feature on homepage]`
          : description,
        content_type: contentType || (format === 'written' ? 'review' : format || 'video'),
        media_url: mediaUrl || null,
        source_type: 'sponsor' as const,
        source_id: userId,
        source_name: sponsorName,
        reward_id: rewardId || null,
        status: 'pending',
        is_featured: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-content'] });
      toast({ title: 'Content submitted!', description: 'Your content is being reviewed and will appear on the platform within 24-48 hours.' });
      resetForm();
      setShowAddDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormat(null);
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setContentType('');
    setRewardId('');
    setRequestFeature(false);
  };

  const publishedCount = submissions.filter(s => s.status === 'published' || s.status === 'featured').length;
  const totalViews = submissions.reduce((sum, s) => sum + (s.view_count || 0), 0);
  const hasRewardsButNoContent = sponsoredRewards.length > 0 && submissions.length === 0;

  return (
    <div className="space-y-6">
      {/* Prompt banner */}
      {hasRewardsButNoContent && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Film className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">🎬 Bring your rewards to life!</p>
            <p className="text-sm text-muted-foreground">Add videos and images to increase engagement with your sponsored rewards.</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            Add Your First Content
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Share Your Story</h2>
          <p className="text-sm text-muted-foreground">Upload videos and images to showcase your products to our community</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Content
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Submissions', value: submissions.length },
          { label: 'Published', value: publishedCount },
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

      {/* Content grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : submissions.length === 0 && !hasRewardsButNoContent ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Video className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold text-lg">No content yet</h3>
            <p className="text-muted-foreground text-sm">Share videos, tutorials, and images to showcase your products.</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map(item => {
            const Icon = TYPE_ICON[item.content_type] || FileText;
            const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{item.content_type}</span>
                      {(item.status === 'published' || item.status === 'featured') && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {item.view_count}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Content Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>What would you like to share?</DialogTitle>
          </DialogHeader>

          {!format ? (
            <div className="grid grid-cols-3 gap-3 pt-2">
              {([
                { value: 'video' as const, icon: Video, label: 'Video', desc: 'Product demo, tutorial, or behind the scenes' },
                { value: 'image' as const, icon: Image, label: 'Images', desc: 'Product shots, lifestyle photos' },
                { value: 'written' as const, icon: FileText, label: 'Story', desc: 'Brand story, founder message' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-center"
                >
                  <opt.icon className="h-8 w-8 text-primary" />
                  <span className="font-medium text-sm">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setFormat(null)} className="text-xs">
                ← Change type
              </Button>

              {format === 'video' && (
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="YouTube, Vimeo, or TikTok URL" className="pl-10" />
                  </div>
                </div>
              )}

              {format === 'image' && (
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Paste image URL" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your content a title" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell the community about this content" className="min-h-[100px]" />
              </div>

              {format === 'video' && (
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_TYPES.map(t => (
                        <SelectItem key={t.label} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Link to reward */}
              {sponsoredRewards.length > 0 && (
                <div className="space-y-2">
                  <Label>Link to Reward</Label>
                  <Select value={rewardId} onValueChange={setRewardId}>
                    <SelectTrigger><SelectValue placeholder="Select a reward (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific reward</SelectItem>
                      {sponsoredRewards.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Feature request */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                <Checkbox
                  id="feature-req"
                  checked={requestFeature}
                  onCheckedChange={(v) => setRequestFeature(v === true)}
                />
                <label htmlFor="feature-req" className="text-sm cursor-pointer">
                  <span className="font-medium">Request homepage feature</span>
                  <p className="text-xs text-muted-foreground">Admin will review and may feature this on the homepage</p>
                </label>
              </div>

              <Button
                className="w-full"
                onClick={() => submitMutation.mutate()}
                disabled={!title || submitMutation.isPending || (format === 'video' && !mediaUrl)}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
