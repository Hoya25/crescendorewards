import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTierBenefits } from '@/hooks/useTierBenefits';
import { usePickCycles, monthLabel } from '@/hooks/useBacking';
import { BackRewardButton } from '@/components/rewards/BackRewardButton';

const MONO = '"DM Mono", monospace';
const DISPLAY = '"Barlow Condensed", sans-serif';

export function StatusSayBlock() {
  const { rows } = useTierBenefits();
  const { data: cycles } = usePickCycles();
  const { data: showStudio } = useQuery({
    queryKey: ['show-studio-share'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_show_studio_share');
      return !!data;
    },
  });
  const open = (cycles ?? []).find((c) => c.status === 'open');
  // Studio backing share has no source yet; wired to the open pick cycle where it will live.
  const studioShare = (open as { studio_share?: number } | undefined)?.studio_share;

  return (
    <div style={{ borderTop: '1px solid var(--nctr-line)', marginTop: 36, paddingTop: 28 }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 34, color: 'var(--nctr-charcoal)', textTransform: 'uppercase', lineHeight: 0.96 }}>
        Status is a say
      </div>
      <div style={{ fontSize: 14, color: 'var(--nctr-ink-soft)', marginTop: 8, maxWidth: 480 }}>
        Your status is your say in what the Alliance sponsors next.
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', border: '1px solid var(--nctr-line)' }}>
        {rows.map((r) => (
          <div key={r.tier.tier_name} style={{ padding: '10px 8px', borderRight: '1px solid var(--nctr-line)' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: 'var(--nctr-muted)', textTransform: 'uppercase' }}>{r.tier.display_name}</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: 'var(--nctr-charcoal)' }}>{r.say.backing_weight}×</div>
            <div style={{ fontSize: 11, color: 'var(--nctr-muted)', lineHeight: 1.3 }}>{r.say.label}</div>
          </div>
        ))}
      </div>

      {open ? (
        <div style={{ marginTop: 18, border: '1px solid var(--nctr-line)', padding: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: 'var(--nctr-muted)', textTransform: 'uppercase' }}>
            {open.kind === 'commons' ? 'Commons Pick' : 'Member Pick'} · {monthLabel(open.cycle_month)}
            {open.envelope_claims ? ` · ${open.envelope_claims.toLocaleString()} Claims envelope` : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 10 }}>
            {open.candidates.map((c) => (
              <div key={c.reward_id} style={{ border: '1px solid var(--nctr-line)' }}>
                <div style={{ height: 90, background: c.image_url ? `#222 url(${c.image_url}) center/cover no-repeat` : '#222' }} />
                <div style={{ padding: 8, fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, textTransform: 'uppercase', color: 'var(--nctr-charcoal)' }}>{c.title}</div>
                <div style={{ padding: '0 8px 8px' }}>
                  <BackRewardButton rewardId={c.reward_id} rewardName={c.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--nctr-muted)' }}>The next Member Pick opens soon.</div>
      )}

      {showStudio && studioShare != null && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--nctr-ink-soft)' }}>
          The Studio leads the Alliance it built, and its say releases as the Alliance distributes. Studio backing share this month: {studioShare}%.
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--nctr-muted)', fontStyle: 'italic' }}>
        Member Picks start with one sponsored reward a month. As the Alliance grows, so does what members decide.
      </div>
    </div>
  );
}
