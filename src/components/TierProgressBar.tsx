import { useEffect, useRef, useState, useCallback } from 'react';

const TIERS = [
  { id: 'bronze', name: 'Bronze', min: 0, color: '#CD7F32', rgb: '205,127,50', glow: 'rgba(205,127,50,0.55)', perks: ['Bronze rewards catalog access','NCTR earning on every purchase','Alliance member newsletter','Partner brand early notifications'] },
  { id: 'silver', name: 'Silver', min: 1000, color: '#C8C8D4', rgb: '200,200,212', glow: 'rgba(200,200,212,0.45)', perks: ['Everything in Bronze','Early access to new partner brands','2× NCTR on select partners','Silver-exclusive reward drops'] },
  { id: 'gold', name: 'Gold', min: 5000, color: '#FFD700', rgb: '255,215,0', glow: 'rgba(255,215,0,0.6)', perks: ['Everything in Silver','Exclusive Gold reward drops','Priority member support','Quarterly Gold member event access'] },
  { id: 'platinum', name: 'Platinum', min: 15000, color: '#E2E2EE', rgb: '226,226,238', glow: 'rgba(226,226,238,0.42)', perks: ['Everything in Gold','VIP brand partner experiences','Dedicated account access','Platinum-only product drops'] },
  { id: 'diamond', name: 'Diamond', min: 50000, color: '#B9F2FF', rgb: '185,242,255', glow: 'rgba(185,242,255,0.62)', perks: ['Everything in Platinum','Founding Diamond member status','Exclusive Diamond drops','Direct founder access & input'] },
];

interface TierProgressBarProps {
  balance?: number;
  lockedBalance?: number;
  onLevelUp?: () => void;
  onViewPerks?: () => void;
}

function getTierIdx(balance: number) {
  return TIERS.reduce((best, t, i) => balance >= t.min ? i : best, 0);
}

function getProgressPct(balance: number) {
  const idx = getTierIdx(balance);
  const cur = TIERS[idx];
  const next = TIERS[idx + 1];
  if (!next) return 100;
  return Math.min(100, Math.max(0, Math.round(((balance - cur.min) / (next.min - cur.min)) * 100)));
}

function useCountUp(target: number, duration = 1350) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const diff = target - fromRef.current;
    if (diff === 0) return;
    cancelAnimationFrame(raf.current);
    startRef.current = null;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / duration, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(fromRef.current + diff * e));
      if (t < 1) { raf.current = requestAnimationFrame(tick); } else { fromRef.current = target; }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return val;
}

export default function TierProgressBar({ balance = 0, lockedBalance = 0, onLevelUp, onViewPerks }: TierProgressBarProps) {
  const [perksOpen, setPerksOpen] = useState(false);
  const [progAnim, setProgAnim] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const displayBal = useCountUp(balance);
  const displayLocked = useCountUp(lockedBalance);
  const tierIdx = getTierIdx(balance);
  const tier = TIERS[tierIdx];
  const nextTier = TIERS[tierIdx + 1] ?? null;
  const progress = getProgressPct(balance);
  const remaining = nextTier ? Math.max(0, nextTier.min - balance) : 0;
  const isMax = !nextTier;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setTimeout(() => setProgAnim(true), 280); } }, { threshold: 0.18 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setProgAnim(false);
    const t = setTimeout(() => setProgAnim(true), 60);
    return () => clearTimeout(t);
  }, [balance]);

  return (
    <article ref={ref} aria-label={`NCTR status: ${tier.name} tier`} style={{ position: 'relative', background: 'rgba(24,24,22,0.96)', border: `1px solid rgba(${tier.rgb},0.22)`, borderRadius: '16px', padding: 'clamp(1.25rem,3.5vw,1.875rem)', backdropFilter: 'blur(24px)', boxShadow: `0 0 52px rgba(${tier.rgb},0.1), 0 22px 44px rgba(0,0,0,0.52)`, transition: 'border-color 0.4s ease, box-shadow 0.45s ease', overflow: 'hidden' }}>
      {/* Corner glow */}
      <div aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: '160px', height: '160px', background: `radial-gradient(ellipse at 100% 0%, rgba(${tier.rgb},0.09) 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, transition: 'background 0.45s ease' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'rgba(217,217,217,0.3)', marginBottom: '5px' }}>Current Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: tier.color, boxShadow: `0 0 10px ${tier.glow}`, transition: 'background 0.4s ease' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.015em', textTransform: 'uppercase' as const, color: tier.color, textShadow: `0 0 22px ${tier.glow}`, transition: 'color 0.4s ease' }}>{tier.name}</h2>
              {isMax && <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: tier.color, padding: '2px 8px', background: `rgba(${tier.rgb},0.13)`, border: `1px solid rgba(${tier.rgb},0.32)`, borderRadius: '999px' }}>MAX</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' as const }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.625rem 0.875rem', minWidth: '100px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '8px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(217,217,217,0.28)', marginBottom: '3px' }}>Total NCTR</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(15px,2.3vw,19px)', fontWeight: 500, lineHeight: 1, color: 'var(--color-accent)' }}>{displayBal.toLocaleString()} <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', color: 'rgba(217,217,217,0.28)' }}>NCTR</span></p>
            </div>
            {lockedBalance > 0 && (
              <div style={{ background: `rgba(${tier.rgb},0.07)`, border: `1px solid rgba(${tier.rgb},0.18)`, borderRadius: '8px', padding: '0.625rem 0.875rem', minWidth: '100px', transition: 'background 0.4s ease' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '8px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: `rgba(${tier.rgb},0.55)`, marginBottom: '3px' }}>360LOCK</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(15px,2.3vw,19px)', fontWeight: 500, lineHeight: 1, color: tier.color, transition: 'color 0.4s ease' }}>{displayLocked.toLocaleString()} <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', color: `rgba(${tier.rgb},0.4)` }}>locked</span></p>
              </div>
            )}
          </div>
        </header>

        {/* Progress track */}
        <div style={{ marginBottom: '1.875rem' }}>
          <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', marginBottom: '0.75rem' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: '999px', width: progAnim ? `${progress}%` : '0%', background: isMax ? `linear-gradient(to right, ${TIERS[TIERS.length-2].color}, ${tier.color})` : `linear-gradient(to right, ${tier.color}, ${nextTier?.color ?? tier.color})`, boxShadow: `0 0 12px ${tier.glow}`, transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
          {!isMax ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(217,217,217,0.48)' }}><span style={{ color: tier.color, fontWeight: 700 }}>{progress}%</span> toward <span style={{ color: nextTier!.color, fontWeight: 600 }}>{nextTier!.name}</span></p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(217,217,217,0.3)' }}>{remaining.toLocaleString()} NCTR to go</p>
            </div>
          ) : (
            <p style={{ textAlign: 'center' as const, fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: tier.color }}>✦ Maximum tier reached — Diamond status active</p>
          )}
        </div>

        {/* Next tier panel */}
        {nextTier && (
          <div style={{ background: `rgba(${nextTier.rgb},0.06)`, border: `1px solid rgba(${nextTier.rgb},0.16)`, borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '0.75rem', transition: 'background 0.4s ease' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: `rgba(${nextTier.rgb},0.55)`, marginBottom: '3px' }}>Unlock Next Tier</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(17px,2.4vw,22px)', fontWeight: 900, lineHeight: 1, textTransform: 'uppercase' as const, color: nextTier.color }}>{nextTier.name}</p>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'rgba(217,217,217,0.25)', marginBottom: '3px' }}>Required</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(15px,1.9vw,19px)', fontWeight: 500, color: 'rgba(217,217,217,0.62)' }}>{nextTier.min.toLocaleString()} <span style={{ fontFamily: 'var(--font-body)', fontSize: '9px', color: 'rgba(217,217,217,0.25)' }}>NCTR</span></p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginBottom: '1rem' }}>
          {onLevelUp && (
            <button onClick={onLevelUp} style={{ height: '40px', padding: '0 22px', background: 'var(--color-accent)', color: 'var(--color-text-on-accent)', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              ↑ Level Up
            </button>
          )}
          <button onClick={() => { setPerksOpen(p => !p); if (onViewPerks) onViewPerks(); }} style={{ height: '40px', padding: '0 22px', background: 'transparent', color: 'rgba(217,217,217,0.6)', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            {perksOpen ? '▴ Hide' : '▾ View'} {tier.name} Perks
          </button>
        </div>

        {/* Perks drawer */}
        <div style={{ maxHeight: perksOpen ? '320px' : '0', opacity: perksOpen ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease' }}>
          <div style={{ background: `rgba(${tier.rgb},0.06)`, border: `1px solid rgba(${tier.rgb},0.14)`, borderRadius: '10px', padding: '0.875rem', transition: 'all 0.3s ease' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: `rgba(${tier.rgb},0.5)`, marginBottom: '8px' }}>{tier.name} Tier Perks</p>
            {tier.perks.map((perk, pi) => (
              <div key={pi} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '5px 0', borderTop: pi > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ marginTop: '3px', flexShrink: 0, color: tier.color }}>
                  <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: 1.5, color: 'rgba(217,217,217,0.62)' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
