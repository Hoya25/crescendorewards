import { useMemo } from 'react';

export interface OpportunityCard {
  type: string;
  name: string;
  description: string;
  status: 'active' | 'locked' | 'coming';
  lockTier?: string;
  details: { label: string; value: string }[];
  borderStyle?: 'solid' | 'dashed';
}

const hardcodedOpportunities: OpportunityCard[] = [
  {
    type: 'Earn Amplifier',
    name: 'Silver Multiplier',
    description: 'Every bounty amplified. 25% more NCTR on everything.',
    status: 'active',
    details: [
      { label: 'Rate', value: '1.25x' },
      { label: 'Extra earned', value: '+2,105 NCTR' },
      { label: 'At Gold', value: '1.5x' },
    ],
  },
  {
    type: 'Early Access',
    name: 'Reward Previews',
    description: 'See and claim new rewards 48 hours before Bronze.',
    status: 'active',
    details: [
      { label: 'Your window', value: '48 hours' },
      { label: 'At Gold', value: '72 hours' },
    ],
  },
  {
    type: 'Creator Tools',
    name: 'Sponsored Content',
    description: 'Submit original content and earn NCTR per approved piece.',
    status: 'locked',
    lockTier: 'Gold',
    details: [
      { label: 'Requires', value: '15,000 NCTR' },
      { label: 'You need', value: '6,580 more' },
    ],
  },
  {
    type: 'Brand Access',
    name: 'Partnership Priority',
    description: 'When new brands join, you get first access to their bounties.',
    status: 'locked',
    lockTier: 'Platinum',
    details: [
      { label: 'Requires', value: '50,000 NCTR' },
    ],
  },
  {
    type: 'Governance',
    name: 'Alliance Voice',
    description: 'Shape the ecosystem. Vote on brands, rewards, and direction.',
    status: 'locked',
    lockTier: 'Diamond',
    details: [
      { label: 'Requires', value: '150,000 NCTR' },
    ],
  },
  {
    type: 'Expanding',
    name: 'New Opportunities',
    description: 'Growing at every tier as the ecosystem evolves.',
    status: 'coming',
    borderStyle: 'dashed',
    details: [],
  },
];

interface OpportunityCardItemProps {
  opportunity: OpportunityCard;
}

function OpportunityCardItem({ opportunity }: OpportunityCardItemProps) {
  const isLocked = opportunity.status === 'locked';
  const isComing = opportunity.status === 'coming';
  const isActive = opportunity.status === 'active';

  const borderColor = isActive ? '#E2FF6D' : '#5A5A58';

  return (
    <div
      style={{
        backgroundColor: '#1E1E1C',
        borderLeft: isComing
          ? '3px dashed #5A5A58'
          : `3px solid ${borderColor}`,
        borderRadius: '0px',
        padding: '16px 20px',
        opacity: isLocked || isComing ? 0.55 : 1,
        transition: 'transform 200ms ease',
        cursor: 'default',
      }}
      className="hover:-translate-y-[2px]"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            color: isLocked || isComing ? '#8A8A88' : '#E2FF6D',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {opportunity.type}
        </span>

        {isActive && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              color: '#E2FF6D',
              border: '1px solid #E2FF6D',
              padding: '3px 8px',
              borderRadius: '0px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            ACTIVE
          </span>
        )}

        {isLocked && opportunity.lockTier && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              color: '#5A5A58',
              border: '1px solid #5A5A58',
              padding: '3px 8px',
              borderRadius: '0px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {opportunity.lockTier}
          </span>
        )}

        {isComing && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              color: '#5A5A58',
              border: '1px solid #5A5A58',
              padding: '3px 8px',
              borderRadius: '0px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            COMING
          </span>
        )}
      </div>

      {/* Name */}
      <h3
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: '18px',
          color: isLocked || isComing ? '#8A8A88' : '#FFFFFF',
          textTransform: 'uppercase',
          margin: '0 0 6px 0',
          lineHeight: 1.2,
        }}
      >
        {opportunity.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          color: '#8A8A88',
          margin: '0 0 14px 0',
          lineHeight: 1.5,
        }}
      >
        {opportunity.description}
      </p>

      {/* Detail row */}
      {opportunity.details.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {opportunity.details.map((detail) => (
            <div key={detail.label}>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '9px',
                  color: '#5A5A58',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '2px',
                }}
              >
                {detail.label}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '12px',
                  color: isLocked || isComing ? '#5A5A58' : '#E2FF6D',
                }}
              >
                {detail.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface OpportunitiesTabProps {
  opportunities?: OpportunityCard[];
}

export function OpportunitiesTab({ opportunities }: OpportunitiesTabProps) {
  const cards = opportunities ?? hardcodedOpportunities;

  return (
    <div style={{ backgroundColor: '#131313', padding: '32px 24px', minHeight: '400px' }}>
      {/* Section header */}
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
        YOUR OPPORTUNITIES
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: '#8A8A88',
          margin: '0 0 28px 0',
          maxWidth: '560px',
          lineHeight: 1.5,
        }}
      >
        Perks that are always on — unlocked by your tier, no claims needed. The higher you climb, the more doors open.
      </p>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {cards.map((opp) => (
          <OpportunityCardItem key={opp.name} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}
