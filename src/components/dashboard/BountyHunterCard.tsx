import { ExternalLink } from 'lucide-react';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

export function BountyHunterCard() {
  const { profile } = useUnifiedUser();
  const nctrBalance = profile?.nctr_balance_points ?? 0;

  return (
    <div
      style={{
        backgroundColor: '#1E1E1C',
        borderLeft: '3px solid #E2FF6D',
        borderRadius: '0px',
        padding: '20px 24px',
      }}
    >
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: '#5A5A58',
          marginBottom: '10px',
        }}
      >
        Ready to earn more?
      </p>

      {nctrBalance > 0 && (
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
          <span style={{ fontSize: '12px', color: '#5A5A58', marginLeft: '6px' }}>NCTR earned</span>
        </p>
      )}

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: '#D9D9D9',
          lineHeight: 1.6,
          marginTop: nctrBalance > 0 ? '8px' : '0px',
          marginBottom: '16px',
        }}
      >
        Earn NCTR and build your status on Bounty Hunter. Your Wingman is ready.
      </p>

      <a
        href="https://bountyhunter.nctr.live"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
          color: '#E2FF6D',
          backgroundColor: 'transparent',
          border: '1px solid #E2FF6D',
          padding: '10px 24px',
          borderRadius: '0px',
          textDecoration: 'none',
        }}
      >
        Open Bounty Hunter →
      </a>
    </div>
  );
}
