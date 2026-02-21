import { useEffect, useRef, useState, useCallback } from 'react';

const TIERS = [
  { id: 'bronze', name: 'Bronze', min: 0, color: '#CD7F32', rgb: '205,127,50', glowRgba: 'rgba(205,127,50,0.45)', tagline: 'Every alliance begins here.', perks: ['Bronze rewards catalog','NCTR earning on all purchases','Alliance member newsletter'] },
  { id: 'silver', name: 'Silver', min: 1000, color: '#C8C8D4', rgb: '200,200,212', glowRgba: 'rgba(200,200,212,0.38)', tagline: 'Early access. More earning.', perks: ['Everything in Bronze','Early access to new brands','2× NCTR on select partners'] },
  { id: 'gold', name: 'Gold', min: 5000, color: '#FFD700', rgb: '255,215,0', glowRgba: 'rgba(255,215,0,0.5)', tagline: 'Exclusive drops. Priority support.', perks: ['Everything in Silver','Exclusive Gold reward drops','Priority member support'] },
  { id: 'platinum', name: 'Platinum', min: 15000, color: '#E2E2EE', rgb: '226,226,238', glowRgba: 'rgba(226,226,238,0.35)', tagline: 'VIP experiences. Dedicated access.', perks: ['Everything in Gold','VIP brand partner experiences','Dedicated account access'] },
  { id: 'diamond', name: 'Diamond', min: 50000, color: '#B9F2FF', rgb: '185,242,255', glowRgba: 'rgba(185,242,255,0.55)', tagline: 'Founding status. Diamond drops.', perks: ['Everything in Platinum','Founding Diamond member status','Exclusive Diamond drops'] },
];

interface CrescendoHeroProps {
  currentBalance?: number;
  onViewRewards?: () => void;
  onLevelUp?: () => void;
}

function getTierIndex(balance: number) {
  return TIERS.reduce((best, tier, i) => balance >= tier.min ? i : best, 0);
}

function getProgress(balance: number, tierIdx: number) {
  const next = TIERS[tierIdx + 1];
  if (!next) return 100;
  const cur = TIERS[tierIdx];
  return Math.min(100, Math.max(0, Math.round(((balance - cur.min) / (next.min - cur.min)) * 100)));
}

export default function CrescendoHero({ currentBalance = 0, onViewRewards, onLevelUp }: CrescendoHeroProps) {
  const tierIdx = getTierIndex(currentBalance);
  const tier = TIERS[tierIdx];
  const nextTier = TIERS[tierIdx + 1] ?? null;
  const progress = getProgress(currentBalance, tierIdx);
  const [activeIdx, setActiveIdx] = useState(tierIdx);
  const activeTier = TIERS[activeIdx];

  useEffect(() => { setActiveIdx(tierIdx); }, [tierIdx]);

  return (
    <section style={{ background: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: 'clamp(4rem,10vh,8rem) clamp(1rem,5vw,3rem)', position: 'relative', overflow: 'hidden' }}>
      {/* Background bloom */}
      <div aria-hidden="true" style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '120vw', height: '600px', background: 'radial-gradient(ellipse at 30% 0%, rgba(226,255,109,0.1) 0%, transparent 55%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
        {/* LEFT — copy */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 14px', border: '1px solid rgba(226,255,109,0.22)', borderRadius: '999px', background: 'rgba(226,255,109,0.055)', marginBottom: '1.75rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'rgba(226,255,109,0.88)' }}>Crescendo by NCTR Alliance</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(40px,5.8vw,80px)', lineHeight: 0.92, letterSpacing: '-0.024em', textTransform: 'uppercase' as const, marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', color: '#fff' }}>Your Status.</span>
            <span style={{ display: 'block', color: 'var(--color-accent)', filter: 'drop-shadow(0 0 22px rgba(226,255,109,0.4))' }}>Your Rewards.</span>
            <span style={{ display: 'block', color: '#fff' }}>Your Life.</span>
          </h1>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.72, color: 'rgba(217,217,217,0.68)', maxWidth: '440px', marginBottom: '2.5rem' }}>
            Unlock exclusive rewards by leveling up your status across the NCTR Alliance ecosystem.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.875rem', marginBottom: '2rem' }}>
            <button onClick={onViewRewards} style={{ height: '48px', padding: '0 28px', background: 'var(--color-accent)', color: 'var(--color-text-on-accent)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              View My Rewards →
            </button>
            <button onClick={onLevelUp} style={{ height: '48px', padding: '0 28px', background: 'transparent', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, border: '1px solid rgba(255,255,255,0.22)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              ↑ Level Up Now
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' as const }}>
            {[{ icon: '🔒', label: '360-day commitment' }, { icon: '⬆', label: '5 status tiers' }, { icon: '✦', label: 'Free to join' }].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px' }}>{b.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'rgba(217,217,217,0.3)' }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — tier card */}
        <div style={{ maxWidth: '420px', justifySelf: 'end' as const }}>
          <div style={{ background: 'rgba(26,26,24,0.92)', border: `1px solid rgba(${activeTier.rgb},0.24)`, borderRadius: '18px', padding: '1.75rem', backdropFilter: 'blur(28px)', boxShadow: `0 0 60px rgba(${activeTier.rgb},0.12), 0 28px 60px rgba(0,0,0,0.58)`, transition: 'border-color 0.4s ease, box-shadow 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'rgba(217,217,217,0.35)', marginBottom: '4px' }}>Your Status Tier</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(28px,3.5vw,36px)', lineHeight: 1, textTransform: 'uppercase' as const, color: activeTier.color, textShadow: `0 0 24px ${activeTier.glowRgba}`, transition: 'color 0.4s ease' }}>{activeTier.name}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ADE80' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#4ADE80' }}>Live</span>
              </div>
            </div>

            {/* Balance */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(217,217,217,0.3)', marginBottom: '4px' }}>Committed Balance</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 500, color: 'var(--color-accent)' }}>
                  {currentBalance.toLocaleString()} <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'rgba(217,217,217,0.36)' }}>NCTR</span>
                </p>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(217,217,217,0.3)', marginBottom: '4px' }}>Lock Period</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500, color: 'rgba(217,217,217,0.62)' }}>360 <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'rgba(217,217,217,0.3)' }}>days</span></p>
              </div>
            </div>

            {/* Progress bar */}
            {nextTier ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, color: tier.color }}>{tier.name}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const, color: nextTier.color }}>{nextTier.name}</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(to right, ${tier.color}, ${nextTier.color})`, borderRadius: '999px', transition: 'width 1.2s ease' }} />
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(217,217,217,0.28)', marginTop: '5px', textAlign: 'right' as const }}>{(nextTier.min - Math.max(currentBalance, tier.min)).toLocaleString()} NCTR to {nextTier.name}</p>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem', padding: '8px 14px', background: `rgba(${activeTier.rgb},0.1)`, border: `1px solid rgba(${activeTier.rgb},0.28)`, borderRadius: '8px', textAlign: 'center' as const }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, color: activeTier.color }}>✦ Maximum Tier Reached</span>
              </div>
            )}

            {/* Tier pills */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(217,217,217,0.28)', marginBottom: '9px' }}>Explore all tiers</p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                {TIERS.map((t, i) => (
                  <button key={t.id} onClick={() => setActiveIdx(i)} aria-pressed={i === activeIdx}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', background: i === activeIdx ? `rgba(${t.rgb},0.18)` : 'rgba(255,255,255,0.04)', border: `1px solid ${i === activeIdx ? t.color : `rgba(${t.rgb},0.16)`}`, borderRadius: '999px', cursor: 'pointer', transition: 'all 160ms ease' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.color }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: i === activeIdx ? t.color : `rgba(${t.rgb},0.55)` }}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Perks */}
            <div style={{ background: `rgba(${activeTier.rgb},0.07)`, border: `1px solid rgba(${activeTier.rgb},0.15)`, borderRadius: '10px', padding: '0.875rem', transition: 'background 0.4s ease' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500, fontStyle: 'italic', color: activeTier.color, marginBottom: '8px' }}>{activeTier.tagline}</p>
              {activeTier.perks.map((perk, pi) => (
                <div key={pi} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '4px 0', borderTop: pi > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ marginTop: '3px', flexShrink: 0, color: activeTier.color }}>
                    <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: 1.45, color: 'rgba(217,217,217,0.68)' }}>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
