import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContentTypeStep, ContentDetailsStep, LinkRewardStep,
  AboutYouStep, ReviewSubmitStep, SubmissionSuccess,
  type ContentFormat,
} from '@/components/content';

const CONTENT_TYPE_MAP: Record<string, string> = {
  'Product Demo / Tutorial': 'tutorial',
  'Behind the Scenes': 'testimonial',
  'Testimonial / Review': 'review',
  'Unboxing': 'unboxing',
  'Tips & Tricks': 'tip',
  'Brand Story': 'video',
  'Other': 'video',
  'Product Photos': 'image',
  'Lifestyle': 'image',
  'Infographic': 'image',
  'Review': 'review',
  'Tip': 'tip',
  'Guide': 'tip',
  'Story': 'testimonial',
};

const TOTAL_STEPS = 5;

export default function SubmitContentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { profile } = useUnifiedUser();
  const userId = profile?.id;

  const prefilledRewardId = searchParams.get('reward_id');
  const prefilledType = searchParams.get('type');

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [format, setFormat] = useState<ContentFormat | null>(
    prefilledType === 'review' ? 'written' : prefilledType === 'video' ? 'video' : null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [contentType, setContentType] = useState(prefilledType === 'review' ? 'Review' : '');
  const [rewardId, setRewardId] = useState<string | null>(prefilledRewardId);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isSponsor, setIsSponsor] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandRole, setBrandRole] = useState('');

  // Fetch linked reward info for prefill banner
  const { data: linkedReward } = useQuery({
    queryKey: ['prefill-reward', prefilledRewardId],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards')
        .select('id, title, image_url')
        .eq('id', prefilledRewardId!)
        .single();
      return data;
    },
    enabled: !!prefilledRewardId,
  });

  // Auto-advance to step 2 if format is prefilled
  useEffect(() => {
    if (format && prefilledType && step === 1) {
      setStep(2);
    }
  }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const sourceType = isSponsor ? 'sponsor' : 'contributor';
      const sourceName = isSponsor ? brandName : (displayName || profile?.display_name || 'Contributor');

      const { error } = await supabase.from('content_submissions').insert({
        title,
        description,
        content_type: CONTENT_TYPE_MAP[contentType] || (format === 'written' ? 'review' : format || 'video'),
        media_url: mediaUrl || null,
        source_type: sourceType,
        source_id: userId,
        source_name: sourceName,
        reward_id: rewardId,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-content'] });
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    },
  });

  const canProceed = () => {
    if (step === 1) return !!format;
    if (step === 2) return !!title && !!contentType && (format !== 'video' || !!mediaUrl) && (format !== 'written' || description.length >= 50);
    if (step === 3) return true;
    if (step === 4) return !!displayName && (!isSponsor || (!!brandName && !!brandRole));
    if (step === 5) return agreedToTerms;
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else submitMutation.mutate();
  };

  if (submitted) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto py-8">
          <SubmissionSuccess />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Share Your Content</h1>
            <p className="text-muted-foreground text-sm">Help the community discover great rewards by sharing videos, tutorials, and tips</p>
          </div>
        </div>

        {/* Prefill banner */}
        {prefilledRewardId && linkedReward && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm">
              <span className="text-muted-foreground">Sharing about:</span>{' '}
              <span className="font-semibold">{linkedReward.title}</span>
            </p>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < TOTAL_STEPS && <div className={cn("w-6 h-0.5", s < step ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {/* Steps */}
        {step === 1 && (
          <ContentTypeStep format={format} onSelect={f => { setFormat(f); setContentType(''); }} />
        )}

        {step === 2 && format && (
          <ContentDetailsStep
            format={format}
            title={title} description={description} mediaUrl={mediaUrl} contentType={contentType}
            onTitleChange={setTitle} onDescriptionChange={setDescription}
            onMediaUrlChange={setMediaUrl} onContentTypeChange={setContentType}
          />
        )}

        {step === 3 && (
          <LinkRewardStep rewardId={rewardId} onRewardIdChange={setRewardId} />
        )}

        {step === 4 && (
          <AboutYouStep
            displayName={displayName} isSponsor={isSponsor} brandName={brandName} brandRole={brandRole}
            onDisplayNameChange={setDisplayName} onIsSponsorChange={setIsSponsor}
            onBrandNameChange={setBrandName} onBrandRoleChange={setBrandRole}
          />
        )}

        {step === 5 && (
          <ReviewSubmitStep
            format={format!}
            title={title} description={description} mediaUrl={mediaUrl} contentType={contentType}
            displayName={displayName} isSponsor={isSponsor} brandName={brandName}
            agreedToTerms={agreedToTerms} onAgreedChange={setAgreedToTerms}
          />
        )}

        {/* Navigation */}
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
            {step === TOTAL_STEPS ? (
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
