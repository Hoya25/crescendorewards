import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Video, Image, FileText, ArrowLeft, ArrowRight, Check, Upload, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ContentFormat = 'video' | 'image' | 'written';

const FORMAT_OPTIONS: { value: ContentFormat; label: string; icon: typeof Video; description: string }[] = [
  { value: 'video', label: 'Video', icon: Video, description: 'YouTube, Vimeo, TikTok, or upload' },
  { value: 'image', label: 'Image / Photo', icon: Image, description: 'Product photos, lifestyle shots' },
  { value: 'written', label: 'Written Review or Tip', icon: FileText, description: 'Reviews, tips, stories' },
];

const VIDEO_TYPES = [
  { value: 'tutorial', label: 'Product Demo / Tutorial' },
  { value: 'testimonial', label: 'Behind the Scenes' },
  { value: 'review', label: 'Testimonial / Review' },
  { value: 'unboxing', label: 'Unboxing' },
  { value: 'tip', label: 'Tips & Tricks' },
  { value: 'video', label: 'Other' },
];

const IMAGE_TYPES = [
  { value: 'image', label: 'Product Photo' },
  { value: 'image', label: 'Lifestyle' },
  { value: 'image', label: 'Infographic' },
];

const WRITTEN_TYPES = [
  { value: 'review', label: 'Review' },
  { value: 'tip', label: 'Tip' },
  { value: 'testimonial', label: 'Story' },
];

export default function SubmitContentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useUnifiedUser();
  const userId = profile?.id;

  const [step, setStep] = useState(1);
  const [format, setFormat] = useState<ContentFormat | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [contentType, setContentType] = useState('');
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rewardSearch, setRewardSearch] = useState('');

  // Fetch rewards for linking
  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards-for-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards')
        .select('id, title')
        .eq('is_active', true)
        .order('title');
      return data || [];
    },
  });

  const filteredRewards = rewards.filter(r =>
    r.title.toLowerCase().includes(rewardSearch.toLowerCase())
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const userName = profile?.display_name || profile?.email || 'Contributor';

      const { error } = await supabase.from('content_submissions').insert({
        title,
        description,
        content_type: contentType || (format === 'written' ? 'review' : format || 'video'),
        media_url: mediaUrl || null,
        source_type: 'contributor',
        source_id: userId,
        source_name: userName,
        reward_id: rewardId,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-content'] });
      toast({ title: 'Content submitted!', description: 'Your content is being reviewed and will appear on the platform within 24-48 hours.' });
      navigate('/my-content');
    },
    onError: (err: Error) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    },
  });

  const canProceed = () => {
    if (step === 1) return !!format;
    if (step === 2) return !!title && (format !== 'video' || !!mediaUrl);
    if (step === 3) return true;
    if (step === 4) return agreedToTerms;
    return false;
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else submitMutation.mutate();
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Share Content</h1>
            <p className="text-muted-foreground text-sm">Add videos, tutorials, and promotional content about rewards</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                s < step ? "bg-primary text-primary-foreground" :
                s === step ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={cn("w-8 h-0.5", s < step ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose format */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>What are you sharing?</CardTitle>
              <CardDescription>Choose the type of content you'd like to submit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFormat(opt.value); setContentType(''); }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left",
                    format === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <opt.icon className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Content details */}
        {step === 2 && format && (
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {format === 'video' && (
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or Vimeo/TikTok link"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {format === 'image' && (
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      placeholder="Paste image URL"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{format === 'image' ? 'Caption' : 'Title'}</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your content a title" />
              </div>

              <div className="space-y-2">
                <Label>{format === 'written' ? 'Content' : 'Description'}</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={format === 'written' ? 'Write your review, tip, or story...' : 'Describe your content'}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {(format === 'video' ? VIDEO_TYPES : format === 'image' ? IMAGE_TYPES : WRITTEN_TYPES).map(t => (
                      <SelectItem key={t.label} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Link to reward */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Link to Reward (Optional)</CardTitle>
              <CardDescription>Is this content about a specific reward?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={rewardSearch}
                onChange={e => setRewardSearch(e.target.value)}
                placeholder="Search rewards..."
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                <button
                  onClick={() => setRewardId(null)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    !rewardId ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-sm text-muted-foreground">No specific reward</span>
                </button>
                {filteredRewards.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRewardId(r.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      rewardId === r.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-sm font-medium">{r.title}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Preview & Submit */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview & Submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{format}</Badge>
                  {contentType && <Badge variant="outline">{contentType}</Badge>}
                </div>
                <h3 className="font-semibold text-lg">{title || 'Untitled'}</h3>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
                {mediaUrl && (
                  <p className="text-xs text-muted-foreground truncate">
                    <LinkIcon className="inline h-3 w-3 mr-1" />{mediaUrl}
                  </p>
                )}
                {rewardId && (
                  <p className="text-xs text-primary">
                    Linked to: {rewards.find(r => r.id === rewardId)?.title}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(v === true)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                  I have the rights to share this content and agree to the community guidelines.
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          ) : <div />}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || submitMutation.isPending}
          >
            {step === 4 ? (
              submitMutation.isPending ? 'Submitting...' : 'Submit for Review'
            ) : (
              <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
