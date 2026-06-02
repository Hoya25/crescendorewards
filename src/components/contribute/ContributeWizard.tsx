import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Upload, Loader2, Star, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase } from '@/integrations/supabase/client';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  LOCK_OPTIONS,
  MIN_FLOOR_USD,
  SOFT_WARN_FLOOR_USD,
  DEFAULT_CLAIM_VALUE_USD,
  computeClaimsRequired,
  computeNctrPreview,
  getLockMultiplier,
  type LockOption,
} from '@/lib/contributor-economics';

type WizardStep = 'gate' | 1 | 2 | 3 | 4 | 5 | 'done';

type WizardState = {
  is_brand_submission: boolean | null;
  // Step 1
  title: string;
  description: string;
  image_urls: string[];
  // Step 2
  delivery_method: string | null;
  scheduling_notes: string | null;
  // Step 3
  fulfillment_timing: string | null;
  fulfillment_days: number | null;
  fulfillment_date: string | null;
  // Step 4
  inventory_type: string | null;
  inventory_count: number | null;
  // Step 5 — contributor path
  floor_usd_amount: number | null;
  lock_option: LockOption | null;
  // Step 5 — brand path
  claims_required: number | null;
  required_status_tier: string | null;
};

const INITIAL_STATE: WizardState = {
  is_brand_submission: null,
  title: '',
  description: '',
  image_urls: [],
  delivery_method: null,
  scheduling_notes: null,
  fulfillment_timing: null,
  fulfillment_days: null,
  fulfillment_date: null,
  inventory_type: null,
  inventory_count: null,
  floor_usd_amount: null,
  lock_option: '360lock',
  claims_required: null,
  required_status_tier: null,
};

const TITLE_MAX = 100;
const DESC_MAX = 2500;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const DELIVERY_OPTIONS = [
  { value: 'instant_code', label: 'Instant code', desc: 'Member gets a code instantly after claiming' },
  { value: 'email', label: 'Email', desc: "You'll email the member after they claim" },
  { value: 'wallet_transfer', label: 'Wallet transfer', desc: "You'll send to their wallet address" },
  { value: 'shipping', label: 'Shipping', desc: "You'll ship a physical item" },
  { value: 'platform_delivery', label: 'Platform delivery', desc: 'Delivered via Discord, Slack, etc.' },
  { value: 'scheduling', label: 'Scheduling', desc: 'Requires scheduling a time' },
  { value: 'manual', label: 'Manual', desc: 'Custom handoff — describe in Step 1' },
];

const TIMING_OPTIONS = [
  { value: 'instant', label: 'Instant', desc: 'Delivered right after a member claims' },
  { value: 'within_days', label: 'Within X days', desc: "You'll deliver within N days of claim" },
  { value: 'on_date', label: 'On a specific date', desc: 'Delivered on a future date' },
  { value: 'ongoing', label: 'Ongoing', desc: 'This is a subscription or recurring offer' },
];

const INVENTORY_OPTIONS = [
  { value: 'one', label: 'One of one', desc: 'Single unit, claimed once, then done' },
  { value: 'fixed', label: 'Fixed count', desc: 'A specific number of units available' },
  { value: 'unlimited', label: 'Unlimited', desc: 'No cap on how many members can claim' },
];

const TIER_OPTIONS = [
  { value: '', label: 'None — no restriction' },
  { value: 'bronze', label: 'Bronze or higher' },
  { value: 'silver', label: 'Silver or higher' },
  { value: 'gold', label: 'Gold or higher' },
  { value: 'platinum', label: 'Platinum or higher' },
  { value: 'diamond', label: 'Diamond only' },
];

export function ContributeWizard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { profile: unifiedProfile } = useUnifiedUser();
  const [step, setStep] = useState<WizardStep>('gate');
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [trustStatus, setTrustStatus] = useState<string | null>(null);
  const [trustLoaded, setTrustLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  // last fetched NCTR price (informational snapshot for submission)
  const lastNctrPrice = useRef<number | null>(null);

  const STORAGE_KEY = user?.id ? `contribute-wizard-${user.id}` : null;

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setTrustLoaded(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('contributor_trust_status')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setTrustStatus(data?.contributor_trust_status ?? null);
      setTrustLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!STORAGE_KEY) return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.state) setState({ ...INITIAL_STATE, ...parsed.state });
        if (parsed.step !== undefined) setStep(parsed.step);
      }
    } catch { /* ignore */ }
  }, [STORAGE_KEY]);

  useEffect(() => {
    if (!STORAGE_KEY) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ state, step }));
  }, [STORAGE_KEY, state, step]);

  if (!trustLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-400 font-mono text-sm">
        Loading...
      </div>
    );
  }

  if (trustStatus === 'revoked') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Card className="rounded-none border border-neutral-800 bg-[#131313] p-10 text-center">
          <h1 className="font-['Barlow_Condensed'] uppercase text-3xl tracking-wide text-neutral-100 mb-4">
            Contributions Unavailable
          </h1>
          <p className="text-neutral-400 font-['DM_Sans'] mb-6">
            Contributions are not currently available for your account.
          </p>
          <Link to="/help" className="inline-block text-[#E2FF6D] font-['DM_Mono'] text-sm underline underline-offset-4">
            Contact support
          </Link>
        </Card>
      </div>
    );
  }

  const showReviewBanner = trustStatus === 'requires_review';

  const update = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));

  const resetWizard = () => {
    setState(INITIAL_STATE);
    setStep('gate');
    setSubmittedId(null);
    if (STORAGE_KEY) sessionStorage.removeItem(STORAGE_KEY);
    lastNctrPrice.current = null;
  };

  const goBack = () => {
    if (step === 'gate' || step === 'done') return;
    if (step === 1) setStep('gate');
    else setStep(((step as number) - 1) as WizardStep);
  };

  const goNext = () => {
    if (step === 'gate' || step === 'done') return;
    if ((step as number) < 5) setStep(((step as number) + 1) as WizardStep);
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return state.title.trim().length > 0 && state.description.trim().length > 0;
      case 2:
        return !!state.delivery_method;
      case 3: {
        if (!state.fulfillment_timing) return false;
        if (state.fulfillment_timing === 'within_days') {
          const d = state.fulfillment_days;
          return Number.isInteger(d) && (d as number) >= 1 && (d as number) <= 90;
        }
        if (state.fulfillment_timing === 'on_date') {
          if (!state.fulfillment_date) return false;
          const picked = new Date(state.fulfillment_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return picked.getTime() > today.getTime();
        }
        return true;
      }
      case 4: {
        if (!state.inventory_type) return false;
        if (state.inventory_type === 'fixed') {
          const c = state.inventory_count;
          return Number.isInteger(c) && (c as number) >= 2 && (c as number) <= 1000;
        }
        return true;
      }
      case 5: {
        if (state.is_brand_submission) {
          const c = state.claims_required;
          return Number.isInteger(c) && (c as number) >= 1 && (c as number) <= 1000;
        }
        return (
          typeof state.floor_usd_amount === 'number' &&
          state.floor_usd_amount >= MIN_FLOOR_USD &&
          state.lock_option !== null
        );
      }
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be signed in.');
      return;
    }
    if (!canAdvance()) return;

    // Soft warning for big values (individual path only)
    if (
      !state.is_brand_submission &&
      typeof state.floor_usd_amount === 'number' &&
      state.floor_usd_amount > SOFT_WARN_FLOOR_USD
    ) {
      const ok = window.confirm(
        `You're listing this at $${state.floor_usd_amount}. That's a large amount — are you sure?`,
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const baseRow = {
        user_id: user.id,
        title: state.title.trim(),
        description: state.description.trim(),
        image_url: state.image_urls[0] ?? null,
        image_urls: state.image_urls,
        category: 'experiences', // TEMPORARY default per spec
        reward_type: 'other', // legacy required field
        delivery_method: state.delivery_method,
        scheduling_notes: state.scheduling_notes,
        fulfillment_timing: state.fulfillment_timing,
        fulfillment_days: state.fulfillment_days,
        fulfillment_date: state.fulfillment_date,
        inventory_type: state.inventory_type,
        inventory_count: state.inventory_count,
        claim_value_at_submission: DEFAULT_CLAIM_VALUE_USD,
        status: 'pending' as const,
      };

      let insertRow: Record<string, unknown>;

      if (state.is_brand_submission) {
        const claims = state.claims_required as number;
        insertRow = {
          ...baseRow,
          reward_origin: 'sponsor',
          is_brand_submission: true,
          required_status_tier: state.required_status_tier || null,
          floor_usd_amount: null,
          lock_option: null,
          multiplier_at_submission: null,
          nctr_rate_at_submission: null,
          nctr_amount_preview_at_submission: null,
          claims_required: claims,
          nctr_value: 0,
          lock_rate: '360',
        };
      } else {
        const floor = state.floor_usd_amount as number;
        const lock = state.lock_option as LockOption;
        const multiplier = getLockMultiplier(lock) ?? LOCK_OPTIONS[lock].multiplier;
        const nctrPrice = lastNctrPrice.current;
        const nctrPreview =
          nctrPrice && nctrPrice > 0 ? computeNctrPreview(floor, multiplier, nctrPrice) : null;
        insertRow = {
          ...baseRow,
          reward_origin: 'contributor',
          is_brand_submission: false,
          floor_usd_amount: floor,
          lock_option: lock,
          multiplier_at_submission: multiplier,
          nctr_rate_at_submission: nctrPrice,
          nctr_amount_preview_at_submission: nctrPreview,
          claims_required: computeClaimsRequired(floor, DEFAULT_CLAIM_VALUE_USD),
          nctr_value: nctrPreview ?? 0,
          lock_rate: lock === '90lock' ? '90' : '360',
        };
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('reward_submissions')
        .insert(insertRow as any)
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      setSubmittedId(inserted.id as string);

      // Atomic-ish trust status bump (cosmetic — failure not fatal)
      if (trustStatus === 'none' || trustStatus === null) {
        const guarded = supabase
          .from('profiles')
          .update({ contributor_trust_status: 'requires_review' })
          .eq('id', user.id);
        const { error: trustErr } =
          trustStatus === null
            ? await guarded.is('contributor_trust_status', null)
            : await guarded.eq('contributor_trust_status', trustStatus);
        if (trustErr) console.warn('Trust status update failed (non-fatal):', trustErr);
        else setTrustStatus('requires_review');
      }

      // Fire admin notification (non-blocking)
      try {
        const notifyPromise = supabase.functions.invoke('send-submission-notification', {
          body: { submission_id: inserted.id },
        });
        await Promise.race([
          notifyPromise,
          new Promise((resolve) => setTimeout(resolve, 10_000)),
        ]);
      } catch (notifyErr) {
        console.warn('send-submission-notification failed (non-fatal):', notifyErr);
      }

      if (STORAGE_KEY) sessionStorage.removeItem(STORAGE_KEY);
      setStep('done');
      toast.success('Reward submitted for review!');
    } catch (err) {
      console.error('Submission failed:', err);
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepHeading: Record<Exclude<WizardStep, 'gate' | 'done'>, string> = {
    1: 'What are you offering?',
    2: 'How will members receive it?',
    3: 'When will you deliver?',
    4: 'How many can you fulfill?',
    5: state.is_brand_submission ? 'Brand contribution' : 'Floor value and lock',
  };

  if (step === 'done') {
    const shareLink = submittedId ? `${window.location.origin}/submission/${submittedId}` : '';
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-neutral-100">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <Card className="rounded-none border border-neutral-800 bg-[#131313] p-10 text-center">
            <CheckCircle2 className="mx-auto mb-4 text-[#E2FF6D]" size={48} />
            <h1 className="font-['Barlow_Condensed'] uppercase text-3xl tracking-wide text-neutral-100 mb-3">
              Submitted!
            </h1>
            <p className="font-['DM_Sans'] text-neutral-400 mb-2">
              We'll review your listing and let you know when it's live.
            </p>
            {submittedId && (
              <>
                <p className="font-['DM_Sans'] text-neutral-400 mb-4">
                  Track its status or share it:
                </p>
                <div className="flex items-center gap-2 mb-6 justify-center max-w-lg mx-auto">
                  <input
                    readOnly
                    value={shareLink}
                    className="flex-1 rounded-none bg-neutral-900 border border-neutral-700 px-3 py-2 font-['DM_Mono'] text-xs text-neutral-300 outline-none"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink).then(() => toast.success('Link copied'));
                    }}
                    className="rounded-none bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                  >
                    Copy link
                  </Button>
                </div>
              </>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {submittedId && (
                <Button
                  onClick={() => navigate(`/submission/${submittedId}`)}
                  className="rounded-none bg-[#E2FF6D] text-black hover:bg-[#E2FF6D]/90"
                >
                  View status
                </Button>
              )}
              <Button
                onClick={() => navigate('/my-submissions')}
                className="rounded-none bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
              >
                View My Submissions
              </Button>
              <Button
                variant="outline"
                onClick={resetWizard}
                className="rounded-none border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
              >
                List another
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'gate':
        return (
          <SubCategoryGate
            onSelect={(isBrand) => {
              update({ is_brand_submission: isBrand });
              setStep(1);
            }}
          />
        );
      case 1:
        return <Step1 state={state} update={update} storagePrefix={unifiedProfile?.id ?? user?.id ?? null} />;
      case 2:
        return <Step2 state={state} update={update} />;
      case 3:
        return <Step3 state={state} update={update} />;
      case 4:
        return <Step4 state={state} update={update} />;
      case 5:
        return state.is_brand_submission ? (
          <Step5Brand state={state} update={update} />
        ) : (
          <Step5Individual state={state} update={update} onPriceFetched={(p) => { lastNctrPrice.current = p; }} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {showReviewBanner && (
          <div className="mb-6 border border-yellow-500/40 bg-yellow-500/5 px-4 py-3">
            <p className="font-['DM_Sans'] text-sm text-yellow-200">
              Your last submission is being reviewed. New submissions will queue behind it.
            </p>
          </div>
        )}

        {step !== 'gate' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="font-['DM_Mono'] text-xs uppercase tracking-widest text-neutral-500">
                Step {step} of 5
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={`h-1 w-10 ${n <= (step as number) ? 'bg-[#E2FF6D]' : 'bg-neutral-800'}`} />
                ))}
              </div>
            </div>
            <h1 className="font-['Barlow_Condensed'] uppercase text-3xl md:text-4xl tracking-wide text-neutral-100">
              {stepHeading[step as Exclude<WizardStep, 'gate' | 'done'>]}
            </h1>
          </div>
        )}

        {renderStep()}

        {step !== 'gate' && (
          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={submitting}
              className="rounded-none border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
            >
              Back
            </Button>
            {step < 5 ? (
              <Button
                onClick={goNext}
                disabled={!canAdvance()}
                className="rounded-none bg-[#E2FF6D] text-black hover:bg-[#E2FF6D]/90 disabled:opacity-40"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canAdvance() || submitting}
                className="rounded-none bg-[#E2FF6D] text-black hover:bg-[#E2FF6D]/90 disabled:opacity-40"
              >
                {submitting ? <><Loader2 className="animate-spin" /> Submitting...</> : 'List My Reward'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────  PRE-STEP  ───────────────────────────── */

function SubCategoryGate({ onSelect }: { onSelect: (isBrand: boolean) => void }) {
  return (
    <Card className="rounded-none border border-neutral-800 bg-[#131313] p-10">
      <h1 className="font-['Barlow_Condensed'] uppercase text-3xl md:text-4xl tracking-wide text-neutral-100 mb-3">
        List a Reward
      </h1>
      <p className="font-['DM_Sans'] text-neutral-400 mb-8">
        Are you offering this as an individual or representing a registered brand?
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { val: false, label: 'Individual', desc: 'Contribute as a member of the community.' },
          { val: true, label: 'Brand', desc: 'Represent a registered brand or business.' },
        ].map((opt) => (
          <button
            key={String(opt.val)}
            onClick={() => onSelect(opt.val)}
            className="rounded-none border border-neutral-800 bg-[#0D0D0D] hover:border-[#E2FF6D] hover:bg-neutral-900 transition-colors p-6 text-left"
          >
            <p className="font-['Barlow_Condensed'] uppercase text-xl tracking-wide text-neutral-100 mb-1">
              {opt.label}
            </p>
            <p className="font-['DM_Sans'] text-sm text-neutral-500">{opt.desc}</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ─────────────────────────────  STEP 1  ───────────────────────────── */

function Step1({
  state,
  update,
  storagePrefix,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  storagePrefix: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!storagePrefix) {
      toast.error('Profile not loaded yet — please wait a moment.');
      return;
    }
    const remaining = MAX_IMAGES - state.image_urls.length;
    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    const newUrls: string[] = [];
    try {
      for (const file of list) {
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error(`${file.name} exceeds 5MB`);
          continue;
        }
        const { file: compressed, originalSize, compressedSize, compressionRatio } =
          await compressImageWithStats(file);
        if (compressionRatio > 0.1) {
          toast.success(`Compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)}`);
        }
        const ext = compressed.name.split('.').pop();
        const fileName = `${storagePrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('reward-images')
          .upload(fileName, compressed, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('reward-images').getPublicUrl(fileName);
        newUrls.push(publicUrl);
      }
      if (newUrls.length) update({ image_urls: [...state.image_urls, ...newUrls] });
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) =>
    update({ image_urls: state.image_urls.filter((_, i) => i !== idx) });

  const uploadDisabled = uploading || state.image_urls.length >= MAX_IMAGES;

  return (
    <Card className="rounded-none border border-neutral-800 bg-[#131313] p-8 space-y-6">
      <Field label="Title" counter={`${state.title.length}/${TITLE_MAX}`}>
        <Input
          value={state.title}
          maxLength={TITLE_MAX}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="e.g., Aroma Original Skull Logo Hoodie"
          className="rounded-none bg-[#0D0D0D] border-neutral-800 focus-visible:ring-[#E2FF6D] focus-visible:border-[#E2FF6D] text-neutral-100 font-['DM_Sans']"
        />
      </Field>

      <Field label="Description" counter={`${state.description.length}/${DESC_MAX}`}>
        <Textarea
          value={state.description}
          maxLength={DESC_MAX}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Tell members what they're getting. Include materials, sizes, condition, color options, anything that matters."
          rows={8}
          className="rounded-none bg-[#0D0D0D] border-neutral-800 focus-visible:ring-[#E2FF6D] focus-visible:border-[#E2FF6D] text-neutral-100 font-['DM_Sans']"
        />
      </Field>

      <Field label="Images" counter={`${state.image_urls.length}/${MAX_IMAGES}`}>
        <div className="space-y-3">
          {state.image_urls.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {state.image_urls.map((url, idx) => (
                <div key={url} className="relative aspect-square border border-neutral-800 bg-[#0D0D0D]">
                  <img src={url} alt={`upload ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#E2FF6D] text-black text-[10px] font-['DM_Mono'] uppercase">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/80 text-neutral-200 flex items-center justify-center hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploadDisabled}
            onClick={() => inputRef.current?.click()}
            className="rounded-none border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900 hover:text-[#E2FF6D] disabled:opacity-40"
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {uploading ? 'Uploading...' : state.image_urls.length >= MAX_IMAGES ? 'Max images reached' : 'Upload images'}
          </Button>
          <p className="font-['DM_Mono'] text-[11px] text-neutral-600 uppercase">
            Up to {MAX_IMAGES} images, 5MB each. First image is the primary.
          </p>
        </div>
      </Field>
    </Card>
  );
}

/* ─────────────────────────────  STEP 2  ───────────────────────────── */

function Step2({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  return (
    <Card className="rounded-none border border-neutral-800 bg-[#131313] p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DELIVERY_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            desc={opt.desc}
            selected={state.delivery_method === opt.value}
            onClick={() => update({ delivery_method: opt.value })}
          />
        ))}
      </div>

      {state.delivery_method === 'scheduling' && (
        <Field label="Scheduling notes (optional)">
          <Input
            value={state.scheduling_notes ?? ''}
            onChange={(e) => update({ scheduling_notes: e.target.value })}
            placeholder="e.g., I'm available evenings PST"
            className="rounded-none bg-[#0D0D0D] border-neutral-800 focus-visible:ring-[#E2FF6D] focus-visible:border-[#E2FF6D] text-neutral-100 font-['DM_Sans']"
          />
        </Field>
      )}
    </Card>
  );
}

/* ─────────────────────────────  STEP 3  ───────────────────────────── */

function Step3({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  const tomorrowIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  return (
    <Card className="rounded-none border border-neutral-800 bg-[#131313] p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TIMING_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            desc={opt.desc}
            selected={state.fulfillment_timing === opt.value}
            onClick={() => {
              const patch: Partial<WizardState> = { fulfillment_timing: opt.value };
              if (opt.value !== 'within_days') patch.fulfillment_days = null;
              if (opt.value !== 'on_date') patch.fulfillment_date = null;
              update(patch);
            }}
          />
        ))}
      </div>

      {state.fulfillment_timing === 'within_days' && (
        <Field label="How many days?">
          <Input
            type="number"
            min={1}
            max={90}
            value={state.fulfillment_days ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              update({ fulfillment_days: v === '' ? null : Math.floor(Number(v)) });
            }}
            placeholder="e.g., 7"
            className="rounded-none bg-[#0D0D0D] border-neutral-800 focus-visible:ring-[#E2FF6D] focus-visible:border-[#E2FF6D] text-neutral-100 font-['DM_Sans'] max-w-[200px]"
          />
          <p className="font-['DM_Mono'] text-[11px] text-neutral-600 uppercase mt-2">Integer between 1 and 90.</p>
        </Field>
      )}

      {state.fulfillment_timing === 'on_date' && (
        <Field label="Delivery date">
          <Input
            type="date"
            min={tomorrowIso}
            value={state.fulfillment_date ?? ''}
            onChange={(e) => update({ fulfillment_date: e.target.value || null })}
            className="rounded-none bg-[#0D0D0D] border-neutral-800 focus-visible:ring-[#E2FF6D] focus-visible:border-[#E2FF6D] text-neutral-100 font-['DM_Sans'] max-w-[240px]"
          />
          <p className="font-['DM_Mono'] text-[11px] text-neutral-600 uppercase mt-2">Must be a future date.</p>
        </Field>
      )}
    </Card>
  );
}

/* ─────────────────────────────  STEP 4  ───────────────────────────── */

function Step4({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  return (
    <Card className="rounded-none border border-neutral-800 bg-[#131313] p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {INVENTORY_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            desc={opt.desc}
            selected={state.inventory_type === opt.value}
            onClick={() => {
              const patch: Partial<WizardState> = { inventory_type: opt.value };
              if (opt.value === 'one') patch.inventory_count = 1;
              else if (opt.value === 'unlimited') patch.inventory_count = null;
              else patch.inventory_count = null;
              update(patch);
            }}
          />
        ))}
      </div>

      {state.inventory_type === 'fixed' && (
        <Field label="How many units?">
          <Input
            type="number"
            min={2}
            max={1000}
            value={state.inventory_count ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              update({ inventory_count: v === '' ? null : Math.floor(Number(v)) });
            }}
            placeholder="e.g., 50"
            className="rounded-none bg-[#0D0D0D] border-neutral-800 focus-visible:ring-[#E2FF6D] focus-visible:border-[#E2FF6D] text-neutral-100 font-['DM_Sans'] max-w-[200px]"
          />
          <p className="font-['DM_Mono'] text-[11px] text-neutral-600 uppercase mt-2">Integer between 2 and 1000.</p>
        </Field>
      )}
    </Card>
  );
}

/* ─────────────────────────────  STEP 5 — INDIVIDUAL  ───────────────────────────── */

function Step5Individual({
  state,
  update,
  onPriceFetched,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onPriceFetched: (price: number | null) => void;
}) {
  const [nctrPrice, setNctrPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [oracleFailed, setOracleFailed] = useState(false);

  const floor = state.floor_usd_amount;
  const lock = state.lock_option;

  // Debounced oracle fetch
  useEffect(() => {
    if (!floor || floor < MIN_FLOOR_USD || !lock) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setPriceLoading(true);
      setOracleFailed(false);
      try {
        const racer = supabase.functions.invoke('get-nctr-price', { body: {} });
        const result = await Promise.race([
          racer,
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10_000)),
        ]) as { data?: { price?: number; nctr_usd?: number }; error?: unknown };
        if (cancelled) return;
        const price = (result?.data?.price ?? result?.data?.nctr_usd) as number | undefined;
        if (typeof price === 'number' && price > 0) {
          setNctrPrice(price);
          onPriceFetched(price);
        } else {
          setOracleFailed(true);
          setNctrPrice(null);
          onPriceFetched(null);
        }
      } catch {
        if (cancelled) return;
        setOracleFailed(true);
        setNctrPrice(null);
        onPriceFetched(null);
      } finally {
        if (!cancelled) setPriceLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [floor, lock, onPriceFetched]);

  const multiplier = lock ? getLockMultiplier(lock) ?? LOCK_OPTIONS[lock].multiplier : null;
  const payoutUsd = floor && multiplier ? floor * multiplier : null;
  const nctrPreview =
    floor && multiplier && nctrPrice && nctrPrice > 0
      ? computeNctrPreview(floor, multiplier, nctrPrice)
      : null;
  const claimsReq = floor ? computeClaimsRequired(floor) : null;

  const showSoftWarn = typeof floor === 'number' && floor > SOFT_WARN_FLOOR_USD;
  const showMinError = typeof floor === 'number' && floor > 0 && floor < MIN_FLOOR_USD;

  return (
    <Card className="rounded-none border border-neutral-800 bg-[#131313] p-8 space-y-8">
      <Field label="What's your reward worth in USD?">
        <Input
          type="number"
          min={MIN_FLOOR_USD}
          value={floor ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            update({ floor_usd_amount: v === '' ? null : Math.floor(Number(v)) });
          }}
          placeholder="e.g., 50"
          className="rounded-none bg-[#0D0D0D] border-neutral-800 focus-visible:ring-[#E2FF6D] focus-visible:border-[#E2FF6D] text-neutral-100 font-['DM_Sans'] max-w-[200px]"
        />
        <p className="font-['DM_Mono'] text-[11px] text-neutral-600 uppercase mt-2">
          This is the dollar value members are claiming.
        </p>
        {showMinError && (
          <p className="font-['DM_Sans'] text-xs text-red-400 mt-2">
            Minimum is ${MIN_FLOOR_USD}.
          </p>
        )}
        {showSoftWarn && (
          <p className="font-['DM_Sans'] text-xs text-yellow-300 mt-2">
            Heads up — that's a sizable listing. You'll be asked to confirm on submit.
          </p>
        )}
      </Field>

      <Field label="Lock duration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(['90lock', '360lock'] as LockOption[]).map((key) => {
            const opt = LOCK_OPTIONS[key];
            const selected = lock === key;
            const isRecommended = key === '360lock';
            return (
              <button
                key={key}
                type="button"
                onClick={() => update({ lock_option: key })}
                className={`rounded-none border p-5 text-left transition-colors relative ${
                  selected
                    ? 'border-[#E2FF6D] bg-[#E2FF6D]/5'
                    : 'border-neutral-800 bg-[#0D0D0D] hover:border-neutral-600 hover:bg-neutral-900'
                }`}
              >
                <p
                  className={`font-['Barlow_Condensed'] uppercase text-xl tracking-wide mb-1 ${
                    selected ? 'text-[#E2FF6D]' : 'text-neutral-100'
                  }`}
                >
                  {opt.label}
                </p>
                <p className="font-['DM_Mono'] text-sm text-neutral-300">
                  {opt.multiplier}x multiplier
                  {isRecommended && <Star className="inline ml-1 -mt-0.5" size={12} fill="#E2FF6D" stroke="#E2FF6D" />}
                </p>
                {isRecommended && (
                  <p className="font-['DM_Mono'] text-[11px] uppercase text-[#E2FF6D] mt-1">Most generous</p>
                )}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Live preview */}
      {floor && floor >= MIN_FLOOR_USD && multiplier && (
        <div className="space-y-4">
          <div className="border border-[#E2FF6D]/30 bg-[#E2FF6D]/5 p-5">
            <p className="font-['DM_Mono'] text-[11px] uppercase tracking-widest text-[#E2FF6D] mb-2">
              Your payout
            </p>
            <p className="font-['DM_Sans'] text-neutral-100 text-base mb-2">
              You'll receive{' '}
              <span className="font-['Barlow_Condensed'] text-2xl text-[#E2FF6D] tracking-wide">
                ${payoutUsd?.toLocaleString()}
              </span>{' '}
              worth of NCTR when a member claims this reward.
            </p>
            <p className="font-['DM_Sans'] text-sm text-neutral-400">
              {priceLoading
                ? 'Fetching today\'s NCTR price…'
                : oracleFailed || !nctrPrice
                ? 'NCTR price unavailable right now — your payout is still defined in dollars.'
                : (
                  <>
                    At today's NCTR price (${nctrPrice.toFixed(6)}), that's approximately{' '}
                    <span className="text-neutral-200 font-['DM_Mono']">
                      {nctrPreview?.toLocaleString()} NCTR
                    </span>{' '}
                    — the exact amount is calculated when a member claims it. Locked for{' '}
                    {LOCK_OPTIONS[lock as LockOption].durationDays} days, then withdrawable.
                  </>
                )}
            </p>
            {(oracleFailed || !nctrPrice) && !priceLoading && (
              <p className="font-['DM_Mono'] text-2xl text-neutral-700 mt-2">—</p>
            )}
          </div>

          <div className="border border-neutral-800 bg-[#0D0D0D] p-5">
            <p className="font-['DM_Mono'] text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
              Member cost
            </p>
            <p className="font-['DM_Sans'] text-neutral-100 text-base">
              Members will spend{' '}
              <span className="font-['Barlow_Condensed'] text-2xl text-neutral-100 tracking-wide">
                {claimsReq}
              </span>{' '}
              {claimsReq === 1 ? 'claim' : 'claims'} to claim this.
            </p>
            <p className="font-['DM_Mono'] text-[11px] text-neutral-600 uppercase mt-2">
              Based on $5 = 1 claim, fixed at submission.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────  STEP 5 — BRAND  ───────────────────────────── */

function Step5Brand({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  return (
    <Card className="rounded-none border border-neutral-800 bg-[#131313] p-8 space-y-6">
      <div className="border border-neutral-800 bg-[#0D0D0D] p-5">
        <p className="font-['DM_Mono'] text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
          Brand contribution
        </p>
        <p className="font-['DM_Sans'] text-neutral-300 text-sm">
          You're contributing this reward on behalf of a brand. There's no NCTR payout — this is a direct contribution to the community.
        </p>
      </div>

      <Field label="Claims required">
        <Input
          type="number"
          min={1}
          max={1000}
          value={state.claims_required ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            update({ claims_required: v === '' ? null : Math.floor(Number(v)) });
          }}
          placeholder="e.g., 10"
          className="rounded-none bg-[#0D0D0D] border-neutral-800 focus-visible:ring-[#E2FF6D] focus-visible:border-[#E2FF6D] text-neutral-100 font-['DM_Sans'] max-w-[200px]"
        />
        <p className="font-['DM_Mono'] text-[11px] text-neutral-600 uppercase mt-2">
          How many claims members spend to claim this. Each claim is worth $5 of perceived reward value.
        </p>
      </Field>

      <Field label="Status tier requirement (optional)">
        <select
          value={state.required_status_tier ?? ''}
          onChange={(e) => update({ required_status_tier: e.target.value || null })}
          className="w-full max-w-[300px] rounded-none bg-[#0D0D0D] border border-neutral-800 text-neutral-100 font-['DM_Sans'] px-3 py-2 focus:outline-none focus:border-[#E2FF6D]"
        >
          {TIER_OPTIONS.map((t) => (
            <option key={t.value} value={t.value} className="bg-[#0D0D0D]">
              {t.label}
            </option>
          ))}
        </select>
        <p className="font-['DM_Mono'] text-[11px] text-neutral-600 uppercase mt-2">
          Restrict claiming to members at this tier or higher. Leave as None for no restriction.
        </p>
      </Field>
    </Card>
  );
}

/* ─────────────────────────────  SHARED  ───────────────────────────── */

function Field({
  label,
  counter,
  children,
}: {
  label: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-['DM_Mono'] text-xs uppercase tracking-widest text-neutral-400">
          {label}
        </label>
        {counter && <span className="font-['DM_Mono'] text-[11px] text-neutral-600">{counter}</span>}
      </div>
      {children}
    </div>
  );
}

function OptionCard({
  label,
  desc,
  selected,
  onClick,
}: {
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-none border p-4 text-left transition-colors ${
        selected
          ? 'border-[#E2FF6D] bg-[#E2FF6D]/5'
          : 'border-neutral-800 bg-[#0D0D0D] hover:border-neutral-600 hover:bg-neutral-900'
      }`}
    >
      <p
        className={`font-['Barlow_Condensed'] uppercase text-lg tracking-wide mb-1 ${
          selected ? 'text-[#E2FF6D]' : 'text-neutral-100'
        }`}
      >
        {label}
      </p>
      <p className="font-['DM_Sans'] text-xs text-neutral-500">{desc}</p>
    </button>
  );
}
