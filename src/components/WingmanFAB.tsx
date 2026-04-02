import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAmbitions, type Ambition } from '@/contexts/AmbitionsContext';

// ─── Breathing keyframes ────────────────────────────────────────────────────
const breathingCSS = `
@keyframes nctr-breathe {
  0%, 100% { opacity: 0.7; stroke-width: 12; }
  50% { opacity: 1; stroke-width: 16; }
}
@keyframes wingman-drawer-open {
  from { max-height: 0; opacity: 0; }
  to   { max-height: 65vh; opacity: 1; }
}
`;

const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";
const dmMono = "'DM Mono', monospace";

// ─── Highlight bold values ──────────────────────────────────────────────────
function renderBold(text: string, boldValues?: string[]) {
  if (!boldValues?.length) return text;
  const regex = new RegExp(`(${boldValues.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    boldValues.includes(part)
      ? <span key={i} style={{ color: '#E2FF6D', fontWeight: 500 }}>{part}</span>
      : part
  );
}

// ─── Build dynamic opportunities section based on ambitions ─────────────────
function buildOpportunitiesInsights(ambitions: Ambition[], onBrowseRewards: () => void) {
  const claimable = ambitions.filter(a => a.claimable);
  const locked = ambitions.filter(a => !a.claimable);

  if (ambitions.length === 0) {
    return {
      insights: [{
        text: "Still learning your patterns. Tap Want This on any reward and I'll start connecting dots.",
        meta: 'Getting to know you',
        variant: 'opportunity' as const,
        boldValues: [] as string[],
      }],
      link: { text: 'Browse rewards →', onClick: onBrowseRewards },
    };
  }

  const insights: { text: string; meta: string; variant: 'opportunity'; boldValues: string[] }[] = [];

  if (claimable.length > 0) {
    const name = claimable[0].rewardName;
    insights.push({
      text: `${name} is ready. This aligns with how you've been engaging.`,
      meta: 'Opportunity detected',
      variant: 'opportunity',
      boldValues: [name],
    });
  }

  if (locked.length > 0) {
    const l = locked[0];
    insights.push({
      text: `You want ${l.rewardName} — that's ${l.distance || 'locked'}. The 5th purchase milestone on Bounty Hunter is 5,000 NCTR in one shot. That changes the timeline.`,
      meta: 'Path analysis',
      variant: 'opportunity',
      boldValues: [l.rewardName, l.distance || 'locked', '5,000 NCTR'],
    });
  }

  if (claimable.length > 0 && locked.length > 0) {
    const lockedName = locked[0].rewardName;
    insights.push({
      text: `Compounding path: claim now → stay active → earn bounties → reach Gold → unlock ${lockedName}. I'm watching.`,
      meta: 'Compounding strategy',
      variant: 'opportunity',
      boldValues: [lockedName],
    });
  }

  return {
    insights,
    link: claimable.length > 0
      ? { text: 'Claim it →', onClick: onBrowseRewards }
      : { text: 'Browse rewards →', onClick: onBrowseRewards },
  };
}

// ─── Section label with line ────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <span style={{ fontFamily: dmMono, fontSize: '9px', color: '#E2FF6D', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {text}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(226,255,109,0.15)' }} />
    </div>
  );
}

// ─── Insight card ───────────────────────────────────────────────────────────
function InsightCard({ text, meta, boldValues, variant }: { text: string; meta: string; boldValues?: string[]; variant?: string }) {
  const isOpp = variant === 'opportunity';
  return (
    <div style={{
      background: isOpp ? 'rgba(226,255,109,0.02)' : 'rgba(19,19,19,0.35)',
      borderLeft: isOpp ? '2px solid rgba(226,255,109,0.5)' : '2px solid #E2FF6D',
      padding: '10px 14px',
      marginBottom: '8px',
    }}>
      <p style={{ fontFamily: dmSans, fontSize: '13px', color: '#D9D9D9', lineHeight: 1.6, margin: '0 0 6px 0' }}>
        {renderBold(text, boldValues)}
      </p>
      <span style={{ fontFamily: dmMono, fontSize: '9px', color: '#5A5A58', textTransform: 'uppercase' }}>
        {meta}
      </span>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export function WingmanFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { ambitions, removeAmbition } = useAmbitions();

  const handleBrowseRewards = useCallback(() => {
    setIsOpen(false);
    navigate('/rewards');
  }, [navigate]);

  const opps = buildOpportunitiesInsights(ambitions, handleBrowseRewards);

  return (
    <>
      <style>{breathingCSS}</style>

      {/* Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: 'min(380px, calc(100vw - 48px))',
            background: '#1E1E1C',
            border: '1px solid rgba(226,255,109,0.12)',
            borderRadius: '0px',
            maxHeight: '65vh',
            overflowY: 'auto',
            zIndex: 100,
            animation: 'wingman-drawer-open 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(90,90,88,0.15)' }}>
            <span style={{ fontFamily: barlow, fontWeight: 700, fontSize: '16px', color: '#FFFFFF', textTransform: 'uppercase' }}>
              YOUR WINGMAN
            </span>
            <span style={{ fontFamily: dmMono, fontSize: '9px', color: '#E2FF6D', border: '1px solid rgba(226,255,109,0.25)', padding: '2px 7px', textTransform: 'uppercase' }}>
              CRESCENDO
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: '16px 18px 20px' }}>
            {/* Section 1: Watching Your 6 */}
            <div style={{ marginBottom: '20px' }}>
              <SectionLabel text="WATCHING YOUR 6" />
              <InsightCard
                text="Your 1.25x has earned you an extra 2,105 NCTR since Silver. Every bounty compounds."
                meta="Earn amplifier · always on"
                boldValues={['1.25x', '2,105 NCTR']}
              />
              <InsightCard
                text="6,580 NCTR to Gold. About 3 weeks at your pace. Gold opens creator tools, merch, and 72-hour early access."
                meta="Tier trajectory"
                boldValues={['6,580 NCTR', 'Gold']}
              />
            </div>

            {/* Section 2: Opportunities Spotted */}
            <div style={{ marginBottom: '20px' }}>
              <SectionLabel text="OPPORTUNITIES SPOTTED" />
              {opps.insights.map((ins, i) => (
                <InsightCard key={i} text={ins.text} meta={ins.meta} boldValues={ins.boldValues} variant={ins.variant} />
              ))}
              {opps.link && (
                <button
                  onClick={opps.link.onClick}
                  style={{ fontFamily: dmMono, fontSize: '10px', color: '#E2FF6D', background: 'none', border: 'none', borderBottom: '1px solid rgba(226,255,109,0.25)', padding: '2px 0', cursor: 'pointer', marginTop: '4px' }}
                >
                  {opps.link.text}
                </button>
              )}
            </div>

            {/* Section 3: Your Ambitions */}
            <div>
              <SectionLabel text={`YOUR AMBITIONS${ambitions.length > 0 ? ` (${ambitions.length})` : ''}`} />
              {ambitions.length === 0 ? (
                <p style={{ fontFamily: dmSans, fontSize: '12px', color: '#8A8A88', textAlign: 'center', margin: '12px 0 0 0' }}>
                  Tell me what you're working toward.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ambitions.map((a) => (
                    <div
                      key={a.rewardId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        background: 'rgba(19,19,19,0.35)',
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: 'rgba(226,255,109,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: dmMono,
                        fontSize: '9px',
                        color: '#E2FF6D',
                        flexShrink: 0,
                      }}>
                        {a.claimable ? '→' : '◇'}
                      </div>
                      {/* Name */}
                      <span style={{
                        fontFamily: barlow,
                        fontWeight: 700,
                        fontSize: '11px',
                        color: '#FFFFFF',
                        textTransform: 'uppercase',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {a.rewardName}
                      </span>
                      {/* Status */}
                      <span style={{
                        fontFamily: dmMono,
                        fontSize: '9px',
                        color: a.claimable ? '#E2FF6D' : '#8A8A88',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {a.claimable ? 'Claimable now' : (a.distance || 'Locked')}
                      </span>
                      {/* Remove */}
                      <button
                        onClick={() => removeAmbition(a.rewardId)}
                        style={{
                          fontFamily: dmMono,
                          fontSize: '10px',
                          color: '#5A5A58',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 2px',
                          flexShrink: 0,
                          transition: 'color 200ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#D9D9D9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#5A5A58'; }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Wingman' : 'Open Wingman'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          width: '56px',
          height: '56px',
          background: isOpen ? '#E2FF6D' : '#131313',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '0 3px 16px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 200ms, background 200ms',
          padding: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="38" height="38" viewBox="0 0 434 434" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="216.855" cy="216.855" r="209.355"
            stroke={isOpen ? '#131313' : '#E2FF6D'}
            strokeWidth="15"
            style={isOpen ? {} : { animation: 'nctr-breathe 4s ease-in-out infinite' }}
          />
          <path
            d="M130.444 309.52C128.745 309.52 127.279 308.902 126.044 307.667C124.809 306.432 124.191 304.965 124.191 303.267V209.485C124.191 207.787 124.809 206.32 126.044 205.085C127.279 203.85 128.745 203.233 130.444 203.233H161.473C163.325 203.233 164.483 202.461 164.946 200.917C165.101 200.609 165.178 200.145 165.178 199.528C165.178 198.447 164.869 197.598 164.252 196.981C159.62 192.504 154.603 187.564 149.2 182.161C143.797 176.603 138.548 171.355 133.454 166.415L126.044 158.773C124.809 157.538 124.191 156.072 124.191 154.373V130.523C124.191 128.825 124.809 127.358 126.044 126.123C127.279 124.888 128.745 124.271 130.444 124.271H154.294C155.992 124.271 157.459 124.888 158.694 126.123L256.876 224.073C257.648 224.845 258.497 225.231 259.423 225.231C260.504 225.231 261.353 224.845 261.97 224.073C262.742 223.302 263.128 222.452 263.128 221.526V187.254C263.128 185.556 263.039 177.682 263.039 177.682C263.039 177.682 262.719 174.55 264.676 172.629C266.455 170.778 268.468 170.565 269.373 170.565H301.897V170.565C306.063 170.565 309.44 173.942 309.44 178.109V185.332V224.305C309.44 226.003 308.823 227.47 307.588 228.705C306.353 229.94 304.886 230.557 303.188 230.557H272.159C270.307 230.557 269.149 231.329 268.686 232.873C268.531 233.181 268.454 233.645 268.454 234.262C268.454 235.343 268.763 236.192 269.38 236.809C274.012 241.286 279.029 246.303 284.432 251.861C289.835 257.264 295.084 262.435 300.178 267.375L307.588 275.017C308.823 276.252 309.44 277.718 309.44 279.417V303.267C309.44 304.965 308.823 306.432 307.588 307.667C306.353 308.902 304.886 309.52 303.188 309.52H279.337C277.639 309.52 276.173 308.902 274.938 307.667L176.756 209.717C175.984 208.945 175.135 208.559 174.209 208.559C173.128 208.559 172.202 208.945 171.43 209.717C170.812 210.488 170.504 211.338 170.504 212.264V303.267C170.504 304.965 169.886 306.432 168.651 307.667C167.416 308.902 165.95 309.52 164.252 309.52H130.444Z"
            fill={isOpen ? '#131313' : '#E2FF6D'}
          />
        </svg>
        {/* Ambition count badge */}
        {ambitions.length > 0 && !isOpen && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '18px',
            height: '18px',
            background: '#E2FF6D',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: dmMono,
            fontSize: '9px',
            color: '#131313',
            fontWeight: 700,
          }}>
            {ambitions.length}
          </div>
        )}
      </button>

      {/* Backdrop to close */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'transparent' }}
        />
      )}
    </>
  );
}
