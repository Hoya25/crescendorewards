import { ExternalLink } from 'lucide-react';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export function BountyHunterCard() {
  const { profile } = useUnifiedUser();
  const nctrBalance = profile?.nctr_balance_points ?? 0;

  return (
    <div
      style={{
        backgroundColor: 'rgba(50, 50, 50, 0.6)',
        border: '1px solid rgba(226, 255, 109, 0.15)',
        borderRadius: '0px',
        padding: '16px 20px',
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          fontWeight: 600,
          color: '#FFFFFF',
          marginBottom: '8px',
        }}
      >
        Bounty Hunter
      </p>

      {nctrBalance > 0 ? (
        <>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '24px',
              fontWeight: 500,
              color: '#E2FF6D',
              lineHeight: 1.2,
            }}
          >
            {nctrBalance.toLocaleString()}
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px',
              color: '#8A8A88',
              marginTop: '2px',
              marginBottom: '12px',
            }}
          >
            NCTR earned
          </p>
          <a
            href="https://bountyhunter.nctr.live/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              color: '#E2FF6D',
              textDecoration: 'none',
            }}
          >
            Continue Earning →
          </a>
        </>
      ) : (
        <>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#8A8A88',
              marginBottom: '12px',
            }}
          >
            Start earning NCTR on Bounty Hunter
          </p>
          <a
            href="https://bountyhunter.nctr.live/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              color: '#E2FF6D',
              textDecoration: 'none',
            }}
          >
            Go to Bounty Hunter <ExternalLink className="w-3 h-3" />
          </a>
        </>
      )}
    </div>
  );
}
