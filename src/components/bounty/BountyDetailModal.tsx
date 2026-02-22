import { useEffect, useCallback, useState } from 'react';
import { X, Lock, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useBountyValidation } from '@/hooks/useBountyValidation';
import type { StaticBounty } from './BountyCardStatic';

export interface BountyModalData {
  bounty: StaticBounty;
  type:
    | 'auto-applied'
    | 'shop-cta'
    | 'milestone-progress'
    | 'merch-cta'
    | 'merch-history'
    | 'content-submit'
    | 'referral-stats'
    | 'referral-milestone';
  progress?: { value: number; max: number; label: string };
  ctaLabel?: string;
  ctaHref?: string;
  earningsSubtitle?: string;
  isLimitedTime?: boolean;
}

interface Props {
  data: BountyModalData | null;
  onClose: () => void;
}

export function BountyDetailModal({ data, onClose }: Props) {
  const [contentLink, setContentLink] = useState('');
  const [contentDesc, setContentDesc] = useState('');
  const { validate, isValidating } = useBountyValidation();

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [data, onClose]);

  if (!data) return null;

  const { bounty, type } = data;
  const Icon = bounty.icon;

  const showValidationToast = (result: { success: boolean; status: string; message: string }) => {
    switch (result.status) {
      case 'eligible':
        toast.success(`🎉 ${bounty.title} — ${result.message}`, {
          duration: 4000,
          style: { backgroundColor: '#E2FF6D', color: '#323232', fontWeight: 700 },
        });
        break;
      case 'auto_applied':
      case 'auto_drip':
        toast.success(`✓ ${result.message}`, {
          duration: 4000,
          style: { backgroundColor: '#E2FF6D', color: '#323232', fontWeight: 700 },
        });
        break;
      case 'pending':
        toast('📋 Submitted for review! We\'ll notify you when approved.', {
          duration: 4000,
          style: { border: '1px solid #E2FF6D', backgroundColor: '#1a1a1a', color: '#fff' },
        });
        break;
      case 'not_eligible':
        toast.warning(`⚠️ ${result.message}`, { duration: 5000 });
        break;
      case 'already_claimed':
        toast('✓ Already claimed', { duration: 3000 });
        break;
      default:
        if (!result.success) {
          toast.error(result.message || 'Something went wrong');
        }
    }
  };

  const handleValidate = async () => {
    try {
      const result = await validate({ bountyId: bounty.id });
      showValidationToast(result);
      if (result.status === 'pending' || result.status === 'eligible') {
        onClose();
      }
    } catch {
      toast.error('Failed to validate bounty. Try again.');
    }
  };

  const handleContentSubmit = async () => {
    if (!contentLink.trim()) {
      toast.error('Please add a link to your content');
      return;
    }
    try {
      const result = await validate({
        bountyId: 'content-creation',
        submissionUrl: contentLink.trim(),
        submissionNotes: contentDesc.trim() || undefined,
      });
      showValidationToast(result);
      if (result.success) {
        setContentLink('');
        setContentDesc('');
        onClose();
      }
    } catch {
      toast.error('Failed to submit content. Try again.');
    }
  };

  // Determine if we should show a "Check Eligibility" button
  const showCheckButton = ['auto-applied', 'milestone-progress', 'merch-cta', 'merch-history', 'referral-stats', 'referral-milestone'].includes(type)
    && !bounty.completed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full sm:max-w-md sm:rounded-2xl rounded-t-[20px] p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-scale-in"
        style={{ backgroundColor: '#111111' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#E2FF6D20' }}
            >
              <Icon className="h-5 w-5" style={{ color: '#E2FF6D' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{bounty.title}</h2>
              <p className="text-xs text-white/50">{bounty.frequency}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Limited time badge */}
        {data.isLimitedTime && (
          <Badge className="text-[10px] font-black border-0 px-2 py-0.5 bg-red-500 text-white">
            LIMITED TIME
          </Badge>
        )}

        {/* Description */}
        <p className="text-sm text-white/70 leading-relaxed">{bounty.description}</p>

        {/* Earnings subtitle */}
        {data.earningsSubtitle && (
          <p className="text-xs font-medium" style={{ color: '#E2FF6D' }}>
            {data.earningsSubtitle}
          </p>
        )}

        {/* Reward */}
        <div
          className="rounded-lg p-3 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <span className="text-xs text-white/50 font-medium">Reward</span>
          <span className="text-xl font-black" style={{ color: '#E2FF6D' }}>
            {bounty.nctrReward.toLocaleString()} NCTR
          </span>
        </div>

        {/* 360LOCK badge */}
        <Badge
          className="text-[10px] font-bold border-0 gap-1 px-2 py-0.5"
          style={{ backgroundColor: '#E2FF6D', color: '#1A1A2E' }}
        >
          <Lock className="h-3 w-3" /> 360LOCK
        </Badge>

        {/* Progress bar for milestones */}
        {data.progress && (type === 'milestone-progress' || type === 'referral-milestone') && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{data.progress.label}</span>
              <span className="font-medium">
                {data.progress.value}/{data.progress.max}
              </span>
            </div>
            <Progress
              value={(data.progress.value / data.progress.max) * 100}
              className="h-2 [&>div]:bg-[#E2FF6D]"
            />
            {data.progress.value >= data.progress.max ? (
              <p className="text-xs font-bold" style={{ color: '#E2FF6D' }}>
                ✓ Milestone reached!
              </p>
            ) : (
              <p className="text-xs text-white/40">
                {data.progress.max - data.progress.value} more to go
              </p>
            )}
          </div>
        )}

        {/* Auto-applied status */}
        {type === 'auto-applied' && (
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: 'rgba(226,255,109,0.08)' }}
          >
            {bounty.completed ? (
              <p className="text-sm font-bold" style={{ color: '#E2FF6D' }}>
                ✓ Claimed & Applied
              </p>
            ) : (
              <p className="text-sm text-white/60">
                This bounty is auto-applied when eligible.
              </p>
            )}
          </div>
        )}

        {/* Content submission form */}
        {type === 'content-submit' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Link to your content</label>
              <Input
                value={contentLink}
                onChange={(e) => setContentLink(e.target.value)}
                placeholder="https://twitter.com/you/status/..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Description (optional)</label>
              <Textarea
                value={contentDesc}
                onChange={(e) => setContentDesc(e.target.value)}
                placeholder="What did you create?"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[60px]"
              />
            </div>
            <Button
              onClick={handleContentSubmit}
              disabled={isValidating}
              className="w-full font-bold text-sm rounded-lg"
              style={{ backgroundColor: '#E2FF6D', color: '#323232' }}
            >
              {isValidating ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
              ) : (
                'Submit for Review'
              )}
            </Button>
            <p className="text-[10px] text-white/30 text-center">
              Submissions are reviewed within 48 hours
            </p>
          </div>
        )}

        {/* CTA button for shop / merch */}
        {data.ctaHref && type !== 'content-submit' && (
          <a
            href={data.ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E2FF6D', color: '#323232' }}
          >
            {data.ctaLabel || 'Go'} <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {/* Check Eligibility / Validate button */}
        {showCheckButton && type !== 'content-submit' && (
          <Button
            onClick={handleValidate}
            disabled={isValidating}
            className="w-full font-bold text-sm rounded-lg"
            style={{ backgroundColor: 'rgba(226,255,109,0.15)', color: '#E2FF6D', border: '1px solid rgba(226,255,109,0.3)' }}
          >
            {isValidating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking...</>
            ) : (
              'Check Eligibility'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
