interface TierRow {
  rank: string;
  name: string;
  nctrRequirement: string;
  multiplier: string;
  perks: string;
  color: string;
  isCurrent?: boolean;
}

const hardcodedTiers: TierRow[] = [
  { rank: '05', name: 'Diamond', nctrRequirement: '150,000 NCTR', multiplier: '2.5x', perks: '50 claims · governance · vault', color: 'rgba(185,242,255,0.9)' },
  { rank: '04', name: 'Platinum', nctrRequirement: '50,000 NCTR', multiplier: '2.0x', perks: '25 claims · brand priority', color: 'rgba(200,200,210,0.9)' },
  { rank: '03', name: 'Gold', nctrRequirement: '15,000 NCTR', multiplier: '1.5x', perks: '10 claims · creator tools · merch', color: 'rgba(255,215,100,0.9)' },
  { rank: '02', name: 'Silver', nctrRequirement: '5,000 NCTR', multiplier: '1.25x', perks: '5 claims · 48hr early · streams', color: 'rgba(192,192,200,0.8)', isCurrent: true },
  { rank: '01', name: 'Bronze', nctrRequirement: '1,000 NCTR', multiplier: '1.0x', perks: '2 claims · wellness', color: 'rgba(180,130,80,0.9)' },
];

interface StandingsTabProps {
  tiers?: TierRow[];
}

export function StandingsTab({ tiers }: StandingsTabProps) {
  const rows = tiers ?? hardcodedTiers;

  return (
    <div style={{ backgroundColor: '#131313', padding: '32px 24px', minHeight: '400px' }}>
      <h2
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: '34px',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          margin: '0 0 8px 0',
          lineHeight: 1.1,
        }}
      >
        TIER STANDINGS
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: '#8A8A88',
          margin: '0 0 28px 0',
          maxWidth: '620px',
          lineHeight: 1.5,
        }}
      >
        Your 360LOCK balance determines your tier. Each unlocks more claims, stronger multipliers, and new opportunities.
      </p>

      <div className="flex flex-col" style={{ gap: '2px' }}>
        {rows.map((tier) => (
          <div
            key={tier.rank}
            className="flex items-center transition-colors duration-150"
            style={{
              backgroundColor: '#1E1E1C',
              padding: '14px 18px',
              gap: '14px',
              borderLeft: tier.isCurrent ? '3px solid #E2FF6D' : '3px solid transparent',
              borderRadius: '0px',
              cursor: 'default',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,30,28,0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E1E1C'; }}
          >
            {/* Rank */}
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '14px',
                color: tier.isCurrent ? '#E2FF6D' : '#8A8A88',
                minWidth: '28px',
              }}
            >
              {tier.rank}
            </span>

            {/* Tier name */}
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '15px',
                textTransform: 'uppercase',
                color: tier.color,
                minWidth: '90px',
              }}
            >
              {tier.name}{tier.isCurrent ? ' ← You' : ''}
            </span>

            {/* NCTR requirement */}
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '12px',
                color: '#8A8A88',
                flex: 1,
              }}
            >
              {tier.nctrRequirement}
            </span>

            {/* Multiplier */}
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '13px',
                color: '#E2FF6D',
                textAlign: 'right',
                minWidth: '40px',
              }}
            >
              {tier.multiplier}
            </span>

            {/* Perks - hidden on mobile */}
            <span
              className="hidden sm:inline"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '11px',
                color: '#D9D9D9',
                textAlign: 'right',
                minWidth: '180px',
              }}
            >
              {tier.perks}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
