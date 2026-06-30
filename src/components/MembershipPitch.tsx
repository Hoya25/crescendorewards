import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const FONT_DISPLAY = '"Barlow Condensed", sans-serif';
const FONT_SANS = '"DM Sans", sans-serif';
const FONT_MONO = '"DM Mono", monospace';

interface Reward {
  id: string;
  title: string;
  category: string | null;
  cost: number | null;
  dollar_value: number | null;
  image_url: string | null;
  sponsor_name: string | null;
  min_status_tier: string | null;
}

function brandOf(r: Reward): string {
  if (r.sponsor_name) return r.sponsor_name;
  if (r.title && (r.title.includes('·') || r.title.includes('—'))) {
    return r.title.split(/[·—]/)[0].trim();
  }
  return '';
}

function tierLabel(t: string | null): string {
  if (!t || t === 'none') return 'All members';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function NctrWordmark({ height = 28 }: { height?: number }) {
  const width = Math.round(height * (805 / 227));
  return (
    <svg width={width} height={height} viewBox="0 0 805 227" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="NCTR">
      <path d="M585.402 227C583.319 227 581.519 226.243 580.004 224.73C578.489 223.217 577.732 221.42 577.732 219.339V104.42C577.732 102.339 578.489 100.542 580.004 99.0288C581.519 97.5154 583.319 96.7587 585.402 96.7587H623.469C625.742 96.7587 627.162 95.8129 627.731 93.9212C627.92 93.5429 628.015 92.9754 628.015 92.2188C628.015 90.8946 627.636 89.8542 626.878 89.0975C621.197 83.6117 615.041 77.5583 608.413 70.9375C601.784 64.1275 595.345 57.6958 589.095 51.6425L580.004 42.2787C578.489 40.7654 577.732 38.9683 577.732 36.8875V7.66124C577.732 5.58041 578.489 3.78333 580.004 2.26999C581.519 0.756667 583.319 0 585.402 0H726.733C731.369 0 735.811 1.83843 739.087 5.11431C748.4 14.4286 767.278 33.3096 768.417 34.4468L799.878 65.8332C803.157 69.1047 805 73.5442 805 78.1735V122.58C805 124.661 804.242 126.458 802.727 127.971C801.212 129.485 799.413 130.241 797.33 130.241H759.262C756.99 130.241 755.569 131.187 755.001 133.079C754.812 133.457 754.717 134.025 754.717 134.781C754.717 136.105 755.096 137.146 755.853 137.902C761.535 143.388 767.69 149.536 774.319 156.346C780.947 162.967 787.387 169.304 793.637 175.357L802.727 184.721C804.242 186.235 805 188.032 805 190.113V219.339C805 221.42 804.242 223.217 802.727 224.73C801.212 226.243 799.413 227 797.33 227H768.069C765.986 227 764.186 226.243 762.671 224.73L642.219 104.704C641.272 103.758 640.23 103.285 639.094 103.285C637.768 103.285 636.632 103.758 635.685 104.704C634.927 105.65 634.549 106.69 634.549 107.825V219.339C634.549 221.42 633.791 223.217 632.276 224.73C630.761 226.243 628.962 227 626.878 227H585.402ZM679.15 59.5875C679.15 60.5333 679.434 61.29 680.002 61.8575L722.899 104.987L740.513 122.296C741.46 123.242 742.501 123.715 743.637 123.715C744.963 123.715 746.005 123.242 746.762 122.296C747.709 121.35 748.183 120.31 748.183 119.175V100.179C748.183 95.5582 746.347 91.126 743.078 87.8559L734.06 78.8352C734.06 78.8352 732.52 77.2963 731.005 75.7829C729.489 74.2696 727.469 72.2511 727.469 72.2511L717.04 61.8498C713.766 58.5842 709.328 56.75 704.702 56.75H681.991C680.855 56.75 679.908 57.4121 679.15 58.7362V59.5875Z" fill="#131313"/>
      <path d="M466.933 227C464.85 227 463.05 226.243 461.535 224.73C460.02 223.217 459.263 221.42 459.263 219.339V70.37C459.263 66.5867 457.937 63.3708 455.285 60.7225C452.634 58.0742 449.414 56.75 445.626 56.75H381.707C379.624 56.75 377.825 55.9933 376.31 54.48C374.794 52.9667 374.037 51.1696 374.037 49.0887V7.66124C374.037 5.58041 374.794 3.78333 376.31 2.26999C377.825 0.756667 379.624 0 381.707 0H451.592C453.676 0 455.475 0.756667 456.99 2.26999C458.505 3.78333 459.263 5.58041 459.263 7.66124V43.13C459.263 46.7242 460.588 49.94 463.24 52.7775C466.081 55.4258 469.3 56.75 472.899 56.75H502.444C506.231 56.75 509.451 55.4258 512.102 52.7775C514.754 49.94 516.08 46.7242 516.08 43.13V7.66124C516.08 5.58041 516.837 3.78333 518.352 2.26999C519.867 0.756667 521.667 0 523.75 0H593.635C595.718 0 597.518 0.756667 599.033 2.26999C600.548 3.78333 601.305 5.58041 601.305 7.66124V49.0887C601.305 51.1696 600.548 52.9667 599.033 54.48C597.518 55.9933 595.718 56.75 593.635 56.75H529.716C526.117 56.75 522.898 58.0742 520.057 60.7225C517.405 63.3708 516.08 66.5867 516.08 70.37V219.339C516.08 221.42 515.322 223.217 513.807 224.73C512.292 226.243 510.493 227 508.409 227H466.933Z" fill="#131313"/>
      <path d="M7.67031 227C5.58702 227 3.78781 226.243 2.27268 224.73C0.757562 223.217 0 221.42 0 219.339V104.42C0 102.339 0.757562 100.542 2.27268 99.0288C3.78781 97.5154 5.58702 96.7587 7.67031 96.7587H45.7378C48.0105 96.7587 49.4309 95.8129 49.9991 93.9212C50.1884 93.5429 50.2831 92.9754 50.2831 92.2188C50.2831 90.8946 49.9044 89.8542 49.1468 89.0975C43.4651 83.6117 37.3099 77.5583 30.6812 70.9375C24.0526 64.1275 17.6133 57.6958 11.3634 51.6425L2.27268 42.2787C0.757562 40.7654 0 38.9683 0 36.8875V7.66124C0 5.58041 0.757562 3.78333 2.27268 2.26999C3.78781 0.756667 5.58702 0 7.67031 0H36.9311C39.0144 0 40.8136 0.756667 42.3287 2.26999L162.781 122.296C163.728 123.242 164.77 123.715 165.906 123.715C167.232 123.715 168.273 123.242 169.031 122.296C169.978 121.35 170.451 120.31 170.451 119.175V77.1783C170.451 75.0974 171.315 70.5813 172.831 69.068C174.346 67.5547 177.557 66.8442 179.641 66.8442H221.117C223.201 66.8442 222.872 66.7262 224.387 68.2395C225.902 69.7529 227.268 72.7428 227.268 74.8237V122.58C227.268 124.661 226.511 126.458 224.996 127.971C223.481 129.485 221.681 130.241 219.598 130.241H181.531C179.258 130.241 177.838 131.187 177.269 133.079C177.08 133.457 176.985 134.025 176.985 134.781C176.985 136.105 177.364 137.146 178.122 137.902C183.803 143.388 189.959 149.536 196.587 156.346C203.216 162.967 209.655 169.304 215.905 175.357L224.996 184.721C226.511 186.235 227.268 188.032 227.268 190.113V219.339C227.268 221.42 226.511 223.217 224.996 224.73C223.481 226.243 221.681 227 219.598 227H190.337C188.254 227 186.455 226.243 184.94 224.73L64.4874 104.704C63.5405 103.758 62.4988 103.285 61.3625 103.285C60.0367 103.285 58.9004 103.758 57.9535 104.704C57.1959 105.65 56.8171 106.69 56.8171 107.825V219.339C56.8171 221.42 56.0595 223.217 54.5444 224.73C53.0293 226.243 51.2301 227 49.1468 227H7.67031Z" fill="#131313"/>
      <path d="M186.887 222.029C184.804 222.029 184.124 217.133 182.609 215.619C181.094 214.106 170.342 205.971 170.342 203.89V64.4112C170.342 62.3304 171.1 60.5333 172.615 59.02C174.13 57.5067 175.929 56.75 178.012 56.75H213.523C217.311 56.75 220.531 55.4258 223.182 52.7775C225.834 49.94 227.159 46.7242 227.159 43.13V7.66124C227.159 5.58041 227.917 3.78333 229.432 2.26999C230.947 0.756667 232.746 0 234.83 0H389.94C392.024 0 393.823 0.756667 395.338 2.26999C396.853 3.78333 397.611 5.58041 397.611 7.66124V49.0887C397.611 51.1696 396.853 52.9667 395.338 54.48C393.823 55.9933 392.024 56.75 389.94 56.75H240.795C237.008 56.75 233.788 58.0742 231.136 60.7225C228.485 63.3708 227.159 66.5867 227.159 70.37V162.589C227.159 164.67 227.917 166.467 229.432 167.98C230.947 169.493 232.746 170.25 234.83 170.25H389.94C392.024 170.25 393.823 171.007 395.338 172.52C396.853 174.033 397.611 175.83 397.611 177.911V219.339C397.611 221.42 396.853 223.217 395.338 224.73C393.823 226.243 392.024 227 389.94 227H215.918L186.887 222.029Z" fill="#131313"/>
    </svg>
  );
}

const CATEGORIES = [
  { name: 'Claimable Rewards', body: 'The catalog you see — new drops every week.' },
  { name: 'Brand Discounts', body: 'Ongoing savings across partner brands. Deeper every tier.' },
  { name: 'Amplified Earning', body: 'Your multiplier. Silver 1.3× → Diamond 2.5×. Everything you do, worth more.' },
  { name: 'Exclusive Access', body: 'Drops, experiences, and perks only status unlocks.' },
];

export default function MembershipPitch() {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, title, category, cost, dollar_value, image_url, sponsor_name, min_status_tier')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('dollar_value', { ascending: false, nullsFirst: false })
        .limit(4);
      if (!error && data) setRewards(data as Reward[]);
    })();
  }, []);

  const hero = rewards[0];
  const grid = rewards.slice(1, 4);

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'var(--nctr-paper)', fontFamily: FONT_SANS }}>
      <div style={{ height: 4, background: 'var(--nctr-lime-muted)' }} />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        <div style={{ marginTop: 40, lineHeight: 0 }}><NctrWordmark height={30} /></div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.3em', color: 'var(--nctr-muted)', marginTop: 12 }}>CRESCENDO MEMBERSHIP</div>

        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 56, lineHeight: 0.95, color: 'var(--nctr-charcoal)', marginTop: 20, textTransform: 'uppercase' }}>
          Your status unlocks a world.
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--nctr-ink-soft)', marginTop: 14, maxWidth: 460 }}>
          Rewards to claim. Discounts at the brands you love. Earning that multiplies. Access others never get. The higher you rise, the more opens.
        </div>

        {hero && (
          <div style={{ marginTop: 26, background: 'var(--nctr-charcoal)' }}>
            <div style={{ height: 200, background: hero.image_url ? `#222 url(${hero.image_url}) center/cover no-repeat` : '#222' }} />
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.18em', color: 'var(--nctr-lime-muted)' }}>
                {brandOf(hero) ? `${brandOf(hero).toUpperCase()} · ` : ''}{tierLabel(hero.min_status_tier).toUpperCase()}
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 24, color: 'var(--nctr-paper)', marginTop: 6, textTransform: 'uppercase', lineHeight: 1 }}>
                {hero.title}
              </div>
              <div style={{ fontSize: 13, color: '#A9A89F', marginTop: 7 }}>
                {hero.dollar_value ? `$${Math.round(hero.dollar_value)} value · ` : ''}the kind of reward your standing unlocks.
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 13, color: 'var(--nctr-muted)', marginTop: 12, fontStyle: 'italic' }}>
          A taste of what's live right now — one of hundreds, growing weekly.
        </div>

        {grid.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
            {grid.map((r) => (
              <div key={r.id} style={{ border: '1px solid var(--nctr-line)', padding: 12 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em', color: 'var(--nctr-muted)' }}>
                  {brandOf(r) ? `${brandOf(r).toUpperCase()} · ` : ''}{tierLabel(r.min_status_tier).toUpperCase()}
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, color: 'var(--nctr-charcoal)', marginTop: 4, textTransform: 'uppercase', lineHeight: 1.05 }}>
                  {r.title}
                </div>
                {r.dollar_value ? (
                  <div style={{ fontSize: 12, color: 'var(--nctr-muted)', marginTop: 4 }}>${Math.round(r.dollar_value)} value.</div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--nctr-line)', marginTop: 40, paddingTop: 28 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 34, color: 'var(--nctr-charcoal)', textTransform: 'uppercase', lineHeight: 0.96 }}>
            What every tier unlocks.
          </div>
          <div style={{ fontSize: 14, color: 'var(--nctr-ink-soft)', marginTop: 8, maxWidth: 480 }}>
            Rewards are one piece. Status keeps paying out four ways — and each grows as you rise.
          </div>
          <div style={{ marginTop: 18 }}>
            {CATEGORIES.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', gap: 13, padding: '13px 0', borderBottom: i < CATEGORIES.length - 1 ? '1px solid #E4E0D5' : 'none' }}>
                <div style={{ width: 3, background: 'var(--nctr-lime-muted)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: 'var(--nctr-charcoal)', textTransform: 'uppercase' }}>{c.name}</div>
                  <div style={{ fontSize: 13.5, color: '#6b6960', marginTop: 2, lineHeight: 1.4 }}>{c.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--nctr-muted)', marginTop: 14, fontStyle: 'italic' }}>And the list keeps growing.</div>
        </div>

        <div style={{ borderTop: '1px solid var(--nctr-line)', marginTop: 36, paddingTop: 28, paddingBottom: 8 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 34, color: 'var(--nctr-charcoal)', textTransform: 'uppercase' }}>The climb.</div>
          <div style={{ fontSize: 14, color: 'var(--nctr-ink-soft)', marginTop: 6, maxWidth: 480 }}>
            Each tier deepens all four. Bronze opens the door. Diamond opens everything.
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, letterSpacing: '0.04em', color: 'var(--nctr-charcoal)', textTransform: 'uppercase', marginTop: 16 }}>
            Bronze <span style={{ color: '#B3AE9E' }}>→ Silver → Gold → Platinum →</span> Diamond
          </div>
          <div style={{ height: 6, background: 'var(--nctr-line)', marginTop: 12 }}>
            <div style={{ height: '100%', width: '46%', background: 'var(--nctr-charcoal)' }} />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--nctr-charcoal)', marginTop: 36, padding: '40px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 32, color: 'var(--nctr-paper)', textTransform: 'uppercase', lineHeight: 1 }}>
            Earn your way in.
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.55, color: '#A9A89F', marginTop: 12, maxWidth: 480 }}>
            You earn status on <span style={{ color: 'var(--nctr-paper)' }}>Bounty Hunter</span> — shopping, bounties, inviting friends. You're not buying access. You're building the thing, and it's owned by everyone who participates.
          </div>
          <button
            onClick={() => window.open('https://bountyhunter.nctr.live', '_blank')}
            style={{ marginTop: 20, background: 'var(--nctr-lime)', color: 'var(--nctr-charcoal)', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '15px 28px', border: 'none', cursor: 'pointer', borderRadius: 0 }}
          >
            Start earning on Bounty Hunter →
          </button>
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => navigate('/rewards')}
              style={{ background: 'none', border: 'none', color: 'var(--nctr-lime-muted)', fontFamily: FONT_MONO, fontSize: 12, letterSpacing: '0.1em', cursor: 'pointer', padding: 0, textTransform: 'uppercase' }}
            >
              Browse all rewards →
            </button>
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 15, letterSpacing: '0.04em', color: 'var(--nctr-lime-muted)', textTransform: 'uppercase', marginTop: 24 }}>Live. Earn. Rise.</div>
        </div>
      </div>
    </div>
  );
}
