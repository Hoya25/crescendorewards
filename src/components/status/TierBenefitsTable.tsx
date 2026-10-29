import { Link } from 'react-router-dom';
import { useTierBenefits } from '@/hooks/useTierBenefits';
import type { TierBenefitRows } from '@/lib/tierBenefits';

const MONO = '"DM Mono", monospace';
const DISPLAY = '"Barlow Condensed", sans-serif';

/** The four shared rows, in order: EARN · OPENS · YOUR SAY · PERKS (hidden when empty). */
export function TierBenefitRowsList({ row, dark = false }: { row: TierBenefitRows; dark?: boolean }) {
  const label = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: dark ? '#8A8A88' : 'var(--nctr-muted)', width: 78, flexShrink: 0 } as const;
  const text = { fontSize: 13.5, color: dark ? '#F5F4F0' : 'var(--nctr-charcoal)', lineHeight: 1.4 } as const;
  const items: [string, React.ReactNode][] = [
    ['EARN', row.earn],
    [
      'OPENS',
      row.opens.count > 0 ? (
        <Link to={row.opens.link} style={{ color: 'inherit' }}>
          {row.opens.label} — {row.opens.first.map((r) => r.title).join(', ')}
          {row.opens.count > 3 ? ` and ${row.opens.count - 3} more` : ''}
        </Link>
      ) : (
        row.opens.label
      ),
    ],
    ['YOUR SAY', row.say.label],
  ];
  if (row.perks.length > 0) items.push(['PERKS', row.perks.join(' · ')]);
  return (
    <div>
      {items.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 12, padding: '6px 0' }}>
          <span style={label}>{k}</span>
          <span style={text}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function TierBenefitsTable({ dark = false }: { dark?: boolean }) {
  const { rows, isLoading } = useTierBenefits();
  if (isLoading) return null;
  return (
    <div>
      {rows.map((row, i) => (
        <div key={row.tier.tier_name} style={{ padding: '14px 0', borderBottom: i < rows.length - 1 ? `1px solid ${dark ? '#2A2A28' : '#E4E0D5'}` : 'none' }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19, textTransform: 'uppercase', color: dark ? '#FFFFFF' : 'var(--nctr-charcoal)', marginBottom: 4 }}>
            {row.tier.display_name}
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 400, marginLeft: 10, color: dark ? '#8A8A88' : 'var(--nctr-muted)' }}>
              {row.tier.min_nctr_360_locked.toLocaleString()} NCTR committed
            </span>
          </div>
          <TierBenefitRowsList row={row} dark={dark} />
        </div>
      ))}
    </div>
  );
}
