import { ReactNode } from 'react';
import { NCTRWordmark } from '@/components/brand/NCTRLogos';
import { useAuthContext } from '@/contexts/AuthContext';
import { ExternalLink } from 'lucide-react';

/** Flip to false when Crescendo is ready to launch */
const CRESCENDO_GATE_ACTIVE = true;

const ALLOWED_EMAILS = [
  'anderson@projectbutterfly.io',
  'bellanderson@gmail.com',
  'kevincearle@gmail.com',
];

export function ComingSoonGate({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();

  if (!CRESCENDO_GATE_ACTIVE) return <>{children}</>;

  const email = user?.email?.toLowerCase();
  if (email && ALLOWED_EMAILS.includes(email)) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center bg-[#0D0D0D]">
      <NCTRWordmark fill="#E2FF6D" height={32} className="mb-12" />

      <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-4">
        CRESCENDO IS GETTING AN UPGRADE
      </h1>

      <p className="text-neutral-400 max-w-md mb-2 text-base md:text-lg">
        We're building something special. Your status and rewards are safe. Check back soon.
      </p>

      <p className="text-neutral-500 text-sm mb-10">
        Expected: Late April 2026
      </p>

      <a
        href="https://bountyhunter.nctr.live"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 bg-[#E2FF6D] text-[#0D0D0D]"
      >
        Keep Earning on Bounty Hunter
        <ExternalLink className="w-4 h-4" />
      </a>

      <p className="text-neutral-500 text-xs mt-8">
        Questions? Talk to your Wingman on Bounty Hunter.
      </p>
    </div>
  );
}
