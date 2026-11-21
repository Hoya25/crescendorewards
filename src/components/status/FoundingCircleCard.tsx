import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MONO = '"DM Mono", monospace';
const DISPLAY = '"Barlow Condensed", sans-serif';

interface CircleRow {
  rank: number | null;
  name: string;
  committed: number;
  isSelf: boolean;
}

// Bounty Hunter owns the Founding Circle ranking; this card only mirrors it.
function toRow(raw: any, fallbackRank: number | null): CircleRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const committed = Number(raw.committed ?? raw.committed_count ?? raw.committed_referrals ?? raw.count ?? 0);
  return {
    rank: typeof raw.rank === 'number' ? raw.rank : fallbackRank,
    name: String(raw.display_name ?? raw.name ?? raw.handle ?? 'Member'),
    committed: Number.isFinite(committed) ? committed : 0,
    isSelf: raw.is_you === true || raw.is_self === true || raw.is_me === true,
  };
}

async function fetchFoundingCircle(): Promise<{ top: CircleRow[]; me: CircleRow | null }> {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));
  const result = await Promise.race([
    supabase.functions.invoke('bh-status-proxy', { body: { action: 'founding_circle' } }),
    timeout,
  ]);
  const { data, error } = result as { data: any; error: any };
  if (error || !data) return { top: [], me: null };
  const list: any[] = Array.isArray(data)
    ? data
    : data.rows ?? data.top ?? data.leaderboard ?? data.circle ?? [];
  const top = (Array.isArray(list) ? list : [])
    .slice(0, 10)
    .map((r, i) => toRow(r, i + 1))
    .filter((r): r is CircleRow => r !== null);
  const me = toRow(data.you ?? data.me ?? data.self ?? data.member ?? null, null);
  return { top, me };
}

export function FoundingCircleCard() {
  const { data } = useQuery({
    queryKey: ['founding-circle'],
    queryFn: fetchFoundingCircle,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!data) return null;
  const top = data.top;
  const isEmpty = top.length === 0;

  const me = data?.me ?? null;
  const meInTop = top.some((r) => r.isSelf) || (me?.rank != null && me.rank <= 10);
  const showMe = !isEmpty && !!me && !meInTop;

  const renderRow = (r: CircleRow, key: string, highlight = false) => (
    <div
      key={key}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--nctr-line)',
        fontWeight: highlight || r.isSelf ? 700 : 400,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--nctr-muted)', minWidth: 28 }}>
        {r.rank != null ? `#${r.rank}` : '—'}
      </span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--nctr-charcoal)' }}>{r.name}</span>
      <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--nctr-charcoal)' }}>
        {r.committed.toLocaleString()} committed
      </span>
    </div>
  );

  return (
    <div style={{ borderTop: '1px solid var(--nctr-line)', marginTop: 36, paddingTop: 28 }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 34, color: 'var(--nctr-charcoal)', textTransform: 'uppercase', lineHeight: 0.96 }}>
        Founding Circle
      </div>
      <div style={{ fontSize: 14, color: 'var(--nctr-ink-soft)', marginTop: 8, maxWidth: 480 }}>
        Members ranked by the people they bring who commit. The top of the circle gets first access to the first sponsored rewards when they open.
      </div>
      <div style={{ marginTop: 14 }}>
        {isEmpty && (
          <div style={{ fontSize: 14, color: 'var(--nctr-charcoal)', padding: '10px 0', borderBottom: '1px solid var(--nctr-line)' }}>
            The circle opens with the first committed invite. Bring your people.
          </div>
        )}
        {top.map((r, i) => renderRow(r, `top-${i}`))}
        {showMe && me && (
          <div style={{ marginTop: 10 }}>{renderRow(me, 'me', true)}</div>
        )}
      </div>
    </div>
  );
}
