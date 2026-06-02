import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LIME = '#E2FF6D';
const BG = '#0a0a0a';
const CARD = '#141414';
const BORDER = '#262626';
const MUTED = '#a3a3a3';

type OwnerRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
};

type PublicData =
  | { public: true; submission_id: string; reward_id: string; title: string; description: string; image_url: string | null; category: string; contributor_display_name: string | null; status: 'available' }
  | { public: false };

const withTimeout = <T,>(p: Promise<T>, ms = 10000): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('Request timed out')), ms)),
  ]);

export default function SubmissionStatusPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [ownerRow, setOwnerRow] = useState<OwnerRow | null>(null);
  const [publicData, setPublicData] = useState<PublicData | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setOwnerRow(null);
    setPublicData(null);

    (async () => {
      // Try owner read (RLS-scoped self-read); ignore errors
      if (isAuthenticated) {
        try {
          const { data } = await withTimeout(
            supabase
              .from('reward_submissions')
              .select('id, user_id, title, description, image_url, category, status, admin_notes, created_at')
              .eq('id', id)
              .maybeSingle() as any
          );
          if (!cancelled && data) setOwnerRow(data as OwnerRow);
        } catch { /* ignore */ }
      }

      // Always try public view in parallel logic — needed for stranger or approved owner views
      try {
        const { data } = await withTimeout(
          supabase.functions.invoke('get-public-submission', { body: { submission_id: id } })
        );
        if (!cancelled && data) setPublicData(data as PublicData);
      } catch { /* ignore */ }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [id, isAuthenticated]);

  const copyShareLink = async () => {
    const url = `${window.location.origin}/submission/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const isOwner = !!(ownerRow && user && ownerRow.user_id === user.id);
  const reward = publicData && publicData.public ? publicData : null;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link to="/" style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>← NCTR</Link>

        {loading && (
          <div style={{ marginTop: 60, textAlign: 'center', color: MUTED }}>Loading…</div>
        )}

        {!loading && isOwner && ownerRow && (
          <OwnerView row={ownerRow} reward={reward} onCopy={copyShareLink} />
        )}

        {!loading && !isOwner && reward && (
          <StrangerView reward={reward} authenticated={isAuthenticated} />
        )}

        {!loading && !isOwner && !reward && (
          <EmptyView />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OwnerRow['status'] }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pending: { bg: '#2a2410', fg: '#facc15', label: 'Under review' },
    approved: { bg: '#1a2a14', fg: LIME, label: 'Approved · Live' },
    rejected: { bg: '#2a1414', fg: '#f87171', label: 'Not approved' },
  };
  const s = map[status];
  return (
    <span style={{ display: 'inline-block', padding: '6px 12px', background: s.bg, color: s.fg, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {s.label}
    </span>
  );
}

function OwnerView({ row, reward, onCopy }: { row: OwnerRow; reward: { reward_id: string } | null; onCopy: () => void }) {
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontSize: 12, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Your submission</div>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px', lineHeight: 1.15 }}>{row.title}</h1>
      <StatusBadge status={row.status} />

      <div style={{ marginTop: 24, padding: 20, background: CARD, border: `1px solid ${BORDER}` }}>
        {row.image_url && (
          <img src={row.image_url} alt={row.title} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', marginBottom: 16 }} />
        )}
        <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{row.category}</div>
        <p style={{ color: '#d4d4d4', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{row.description}</p>
      </div>

      {row.status === 'pending' && (
        <p style={{ color: MUTED, marginTop: 16, fontSize: 14 }}>
          Our team is reviewing your submission. You'll be notified once it's approved or if we need changes.
        </p>
      )}

      {row.status === 'rejected' && row.admin_notes && (
        <div style={{ marginTop: 16, padding: 16, background: '#1a0e0e', border: '1px solid #3a1818' }}>
          <div style={{ fontSize: 11, color: '#f87171', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Reviewer notes</div>
          <p style={{ color: '#fecaca', margin: 0, fontSize: 14, lineHeight: 1.5 }}>{row.admin_notes}</p>
        </div>
      )}

      {row.status === 'approved' && reward && (
        <p style={{ color: MUTED, marginTop: 16, fontSize: 14 }}>
          Your reward is live. Share the link — anyone who opens it sees a clean public preview.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
        <button
          onClick={onCopy}
          style={{ padding: '12px 20px', background: LIME, color: '#000', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', letterSpacing: 0.3 }}
        >
          Copy share link
        </button>
        {row.status === 'approved' && reward && (
          <Link
            to={`/rewards/${reward.reward_id}`}
            style={{ padding: '12px 20px', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 14, border: `1px solid ${BORDER}`, textDecoration: 'none', letterSpacing: 0.3 }}
          >
            View live reward →
          </Link>
        )}
        <Link
          to="/my-submissions"
          style={{ padding: '12px 20px', background: 'transparent', color: MUTED, fontWeight: 600, fontSize: 14, border: `1px solid ${BORDER}`, textDecoration: 'none', letterSpacing: 0.3 }}
        >
          All my submissions
        </Link>
      </div>
    </div>
  );
}

function StrangerView({ reward, authenticated }: { reward: Extract<PublicData, { public: true }>; authenticated: boolean }) {
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontSize: 12, color: LIME, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Available now</div>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.15 }}>{reward.title}</h1>
      {reward.contributor_display_name && (
        <div style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>Listed by {reward.contributor_display_name}</div>
      )}

      <div style={{ padding: 20, background: CARD, border: `1px solid ${BORDER}` }}>
        {reward.image_url && (
          <img src={reward.image_url} alt={reward.title} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', marginBottom: 16 }} />
        )}
        <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{reward.category}</div>
        <p style={{ color: '#d4d4d4', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{reward.description}</p>
      </div>

      <div style={{ marginTop: 24, padding: 20, border: `1px solid ${BORDER}` }}>
        <p style={{ color: '#fff', margin: '0 0 12px', fontSize: 15, lineHeight: 1.5 }}>
          Collect NCTR by participating. Build status. Redeem rewards like this.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
          {authenticated ? (
            <Link
              to={`/rewards/${reward.reward_id}`}
              style={{ padding: '12px 20px', background: LIME, color: '#000', fontWeight: 600, fontSize: 14, textDecoration: 'none', letterSpacing: 0.3 }}
            >
              View in Rewards →
            </Link>
          ) : (
            <>
              <a
                href="https://bountyhunter.nctr.live/auth"
                style={{ padding: '12px 20px', background: LIME, color: '#000', fontWeight: 600, fontSize: 14, textDecoration: 'none', letterSpacing: 0.3 }}
              >
                Join the Alliance on Bounty Hunter
              </a>
              <Link
                to={`/rewards/${reward.reward_id}`}
                style={{ padding: '12px 20px', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 14, border: `1px solid ${BORDER}`, textDecoration: 'none', letterSpacing: 0.3 }}
              >
                See reward
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyView() {
  return (
    <div style={{ marginTop: 80, textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 12px' }}>This submission isn't public yet</h1>
      <p style={{ color: MUTED, margin: '0 0 24px', fontSize: 15 }}>
        It may still be under review, or the link is no longer active.
      </p>
      <Link
        to="/crescendo/rewards"
        style={{ display: 'inline-block', padding: '12px 20px', background: LIME, color: '#000', fontWeight: 600, fontSize: 14, textDecoration: 'none', letterSpacing: 0.3 }}
      >
        Browse rewards
      </Link>
    </div>
  );
}
