import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { barlow, dmSans, sectionClass, sectionHeading } from './landingStyles';

const REWARD_TILES_ENABLED = false;

interface RewardTile {
  id: string;
  title: string;
  image_url: string | null;
  min_status_tier: string | null;
}

const cardStyle = { backgroundColor: 'var(--landing-card)', border: '1px solid var(--landing-line)', borderRadius: 0 } as const;
const chipStyle = {
  display: 'inline-block',
  backgroundColor: 'var(--nctr-charcoal)',
  color: 'var(--landing-band-text)',
  fontFamily: barlow,
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  padding: '4px 8px',
};
const tileTitle = { fontFamily: barlow, fontWeight: 700, fontSize: '20px', textTransform: 'uppercase' as const, color: 'var(--landing-ink)', lineHeight: 1.1 };

const AT_LAUNCH = [
  { chip: 'ALL MEMBERS', title: 'The everyday.', text: 'The brands you already shop start giving back.' },
  { chip: 'BRONZE', title: 'The things you love.', text: 'The subscriptions and rituals you pay for now, sponsored as your status grows.' },
  { chip: 'GOLD', title: "The life you're building.", text: 'The shows, the trips, the gear. The things you keep putting off.' },
];

const capitalise = (t: string | null) => (t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '');

export function Section2StatusOpens() {
  const [state, setState] = useState<{ loading: boolean; rows: RewardTile[] }>({ loading: REWARD_TILES_ENABLED, rows: [] });

  useEffect(() => {
    if (!REWARD_TILES_ENABLED) return;
    let cancelled = false;
    const nowIso = new Date().toISOString();
    supabase
      .from('rewards')
      .select('id, title, image_url, min_status_tier')
      .eq('is_active', true)
      .or('is_preview.is.null,is_preview.eq.false')
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .or('publish_at.is.null,publish_at.lte.' + nowIso)
      .or('unpublish_at.is.null,unpublish_at.gt.' + nowIso)
      .order('display_order')
      .order('title')
      .limit(6)
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({ loading: false, rows: error || !data ? [] : (data as RewardTile[]) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const caseA = REWARD_TILES_ENABLED && !state.loading && state.rows.length >= 3;

  return (
    <section className="px-6 md:px-12 pt-12 pb-20 md:py-28">
      <div className="max-w-7xl mx-auto">
        <h2 style={sectionHeading}>What your status opens.</h2>
        <p className="mt-4" style={{ fontFamily: dmSans, fontSize: '16px', color: 'var(--landing-muted)', lineHeight: 1.6 }}>
          The things you already buy sponsor the things you love.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={state.loading ? { minHeight: '420px' } : undefined}>
          {state.loading
            ? null
            : caseA
              ? state.rows.map((r) => (
                  <Link key={r.id} to={`/rewards/${r.id}`} style={{ ...cardStyle, textDecoration: 'none', display: 'block' }}>
                    <div style={{ aspectRatio: '4 / 5', backgroundColor: 'var(--landing-image-fallback)', overflow: 'hidden' }}>
                      <img src={r.image_url ?? ''} alt={r.title} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5">
                      <p style={tileTitle}>{r.title}</p>
                      {r.min_status_tier && (
                        <span className="mt-3" style={chipStyle}>Opens at {capitalise(r.min_status_tier)}</span>
                      )}
                    </div>
                  </Link>
                ))
              : AT_LAUNCH.map((t) => (
                  <div key={t.title} className="p-6" style={cardStyle}>
                    <p style={{ fontFamily: barlow, fontWeight: 700, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--landing-muted)' }}>
                      At launch
                    </p>
                    <span className="mt-2" style={chipStyle}>{t.chip}</span>
                    <p className="mt-4" style={tileTitle}>{t.title}</p>
                    <p className="mt-3" style={{ fontFamily: dmSans, fontSize: '16px', color: 'var(--landing-ink)', lineHeight: 1.6 }}>{t.text}</p>
                  </div>
                ))}
        </div>
      </div>
    </section>
  );
}
