import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type LockOption } from '@/lib/contributor-economics';

type WizardStep = 'gate' | 1 | 2 | 3 | 4 | 5;

type WizardState = {
  is_brand_submission: boolean | null;
  title: string;
  description: string;
  image_urls: string[];
  delivery_method: string | null;
  scheduling_notes: string | null;
  fulfillment_timing: string | null;
  fulfillment_days: number | null;
  fulfillment_date: string | null;
  inventory_type: string | null;
  inventory_count: number | null;
  floor_usd_amount: number | null;
  lock_option: LockOption | null;
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
};

export function ContributeWizard() {
  const { user } = useAuthContext();
  const [step, setStep] = useState<WizardStep>('gate');
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [trustStatus, setTrustStatus] = useState<string | null>(null);
  const [trustLoaded, setTrustLoaded] = useState(false);

  const STORAGE_KEY = user?.id ? `contribute-wizard-${user.id}` : null;

  // Fetch contributor_trust_status (per v2 spec Section 4.4)
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
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Hydrate from sessionStorage
  useEffect(() => {
    if (!STORAGE_KEY) return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.state) setState(parsed.state);
        if (parsed.step !== undefined) setStep(parsed.step);
      }
    } catch {
      /* ignore */
    }
  }, [STORAGE_KEY]);

  // Persist to sessionStorage
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

  // Trust gate: revoked
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
          <Link
            to="/help"
            className="inline-block text-[#E2FF6D] font-['DM_Mono'] text-sm underline underline-offset-4"
          >
            Contact support
          </Link>
        </Card>
      </div>
    );
  }

  const showReviewBanner = trustStatus === 'requires_review';

  const goBack = () => {
    if (step === 'gate') return;
    if (step === 1) setStep('gate');
    else setStep(((step as number) - 1) as WizardStep);
  };

  const goNext = () => {
    if (step === 'gate') return; // gate advances via SubCategoryGate
    if (step < 5) setStep(((step as number) + 1) as WizardStep);
  };

  const renderStep = () => {
    switch (step) {
      case 'gate':
        return (
          <SubCategoryGate
            onSelect={(isBrand) => {
              setState({ ...state, is_brand_submission: isBrand });
              setStep(1);
            }}
          />
        );
      case 1:
        return <StepPlaceholder n={1} label="What are you offering?" />;
      case 2:
        return <StepPlaceholder n={2} label="How will members receive it?" />;
      case 3:
        return <StepPlaceholder n={3} label="When will you deliver?" />;
      case 4:
        return <StepPlaceholder n={4} label="How many can you fulfill?" />;
      case 5:
        return <StepPlaceholder n={5} label="Floor value and lock" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {showReviewBanner && (
          <div className="mb-6 border border-yellow-500/40 bg-yellow-500/5 px-4 py-3 rounded-none">
            <p className="font-['DM_Sans'] text-sm text-yellow-200">
              Your last submission is being reviewed. New submissions will queue behind it.
            </p>
          </div>
        )}

        {step !== 'gate' && (
          <div className="mb-8 flex items-center justify-between">
            <p className="font-['DM_Mono'] text-xs uppercase tracking-widest text-neutral-500">
              Step {step} of 5
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`h-1 w-10 ${
                    n <= (step as number) ? 'bg-[#E2FF6D]' : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {renderStep()}

        {step !== 'gate' && (
          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              className="rounded-none border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
            >
              Back
            </Button>
            {step < 5 ? (
              <Button
                onClick={goNext}
                className="rounded-none bg-[#E2FF6D] text-black hover:bg-[#E2FF6D]/90"
              >
                Next
              </Button>
            ) : (
              <Button
                disabled
                className="rounded-none bg-[#E2FF6D] text-black hover:bg-[#E2FF6D]/90"
              >
                List My Reward
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
        <button
          onClick={() => onSelect(false)}
          className="rounded-none border border-neutral-800 bg-[#0D0D0D] hover:border-[#E2FF6D] hover:bg-neutral-900 transition-colors p-6 text-left"
        >
          <p className="font-['Barlow_Condensed'] uppercase text-xl tracking-wide text-neutral-100 mb-1">
            Individual
          </p>
          <p className="font-['DM_Sans'] text-sm text-neutral-500">
            Contribute as a member of the community.
          </p>
        </button>
        <button
          onClick={() => onSelect(true)}
          className="rounded-none border border-neutral-800 bg-[#0D0D0D] hover:border-[#E2FF6D] hover:bg-neutral-900 transition-colors p-6 text-left"
        >
          <p className="font-['Barlow_Condensed'] uppercase text-xl tracking-wide text-neutral-100 mb-1">
            Brand
          </p>
          <p className="font-['DM_Sans'] text-sm text-neutral-500">
            Represent a registered brand or business.
          </p>
        </button>
      </div>
    </Card>
  );
}

function StepPlaceholder({ n, label }: { n: number; label: string }) {
  return (
    <Card className="rounded-none border border-neutral-800 bg-[#131313] p-10">
      <p className="font-['DM_Mono'] text-xs uppercase tracking-widest text-[#E2FF6D] mb-2">
        Step {n}
      </p>
      <h2 className="font-['Barlow_Condensed'] uppercase text-2xl tracking-wide text-neutral-100 mb-3">
        {label}
      </h2>
      <p className="font-['DM_Sans'] text-neutral-500 text-sm">
        Coming in Turn {n === 5 ? 7 : 6}.
      </p>
    </Card>
  );
}
