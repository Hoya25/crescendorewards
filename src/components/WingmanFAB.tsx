import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAmbitions } from '@/contexts/AmbitionsContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { NCTRCircleN } from '@/components/brand/NCTRLogos';

// ─── Keyframes ──────────────────────────────────────────────────────────────
const wingmanCSS = `
@keyframes nctr-breathe {
  0%, 100% { opacity: 0.7; stroke-width: 12; }
  50% { opacity: 1; stroke-width: 16; }
}
@keyframes wingman-slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
`;

const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";
const dmMono = "'DM Mono', monospace";

const CACHE_KEY = 'nctr_crescendo_wingman_briefing';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface BriefingData {
  your_brief: string[];
  spotted: string[];
  ambitions_enriched: string[];
  watching_your_6?: string[];
  opportunities_spotted?: string[];
}

const FALLBACK: BriefingData = {
  your_brief: ['Syncing with the ecosystem...'],
  spotted: ["I'm still learning your patterns. Tap 'Want This' on any reward and I'll start connecting the dots."],
  ambitions_enriched: [],
};

// ─── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonLines() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: '13px',
            background: 'rgba(90,90,88,0.2)',
            borderRadius: '0px',
            width: i === 3 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

// ─── Section ────────────────────────────────────────────────────────────────
function Section({
  title,
  items,
  emptyText,
  isLoading,
  showDivider,
}: {
  title: string;
  items: string[];
  emptyText: string;
  isLoading: boolean;
  showDivider: boolean;
}) {
  return (
    <div
      style={{
        paddingTop: showDivider ? '24px' : 0,
        borderTop: showDivider ? '1px solid #2A2A2A' : 'none',
        marginTop: showDivider ? '24px' : 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: dmMono,
          fontSize: '11px',
          color: '#E2FF6D',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
          marginBottom: '12px',
        }}
      >
        {title}
      </div>

      {isLoading ? (
        <SkeletonLines />
      ) : items.length === 0 ? (
        <p style={{ fontFamily: dmSans, fontSize: '13px', color: '#8A8A88', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#E2FF6D',
                  marginTop: '6px',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: dmSans, fontSize: '13px', color: '#D9D9D9', lineHeight: 1.5 }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export function WingmanFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { ambitions, removeAmbition } = useAmbitions();
  const { user } = useAuthContext();

  const fetchBriefing = useCallback(async () => {
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.cached_at < CACHE_TTL && parsed.data) {
          setBriefing(parsed.data);
          return;
        }
      }
    } catch { /* ignore */ }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wingman-crescendo-briefing', {
        body: { user_id: user?.id },
      });

      if (error) {
        console.error('Wingman briefing error:', error);
        setBriefing(FALLBACK);
      } else {
        const structured = data as BriefingData;
        setBriefing(structured);
        // Cache result
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: structured, cached_at: Date.now() }));
      }
    } catch (e) {
      console.error('Wingman fetch failed:', e);
      setBriefing(FALLBACK);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch on drawer open
  useEffect(() => {
    if (isOpen) {
      fetchBriefing();
    }
  }, [isOpen, fetchBriefing]);

  const handleBrowseRewards = useCallback(() => {
    setIsOpen(false);
    navigate('/rewards');
  }, [navigate]);

  return (
    <>
      <style>{wingmanCSS}</style>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#1A1A1A',
            maxHeight: '70vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            zIndex: 100,
            padding: '24px',
            borderRadius: '16px 16px 0 0',
            animation: 'wingman-slide-up 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: dmMono,
                  fontSize: '11px',
                  color: '#E2FF6D',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 500,
                  marginBottom: '4px',
                }}
              >
                WINGMAN
              </div>
              <div
                style={{
                  fontFamily: barlow,
                  fontWeight: 700,
                  fontSize: '16px',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                YOUR WINGMAN
              </div>
              <div style={{ fontFamily: dmMono, fontSize: '12px', color: '#8A8A88', marginTop: '2px' }}>
                @{user?.email?.split('@')[0] || 'member'}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                fontFamily: dmSans,
                fontSize: '24px',
                color: '#8A8A88',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1,
                transition: 'color 200ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A88'; }}
            >
              ×
            </button>
          </div>

          {/* Section 1: Your Brief */}
          <Section
            title="YOUR BRIEF"
            items={briefing?.your_brief || briefing?.watching_your_6 || []}
            emptyText="Syncing with the ecosystem..."
            isLoading={isLoading}
            showDivider={false}
          />

          {/* Section 2: Spotted */}
          <Section
            title="SPOTTED"
            items={briefing?.spotted || briefing?.opportunities_spotted || []}
            emptyText="I'm still learning your patterns. Tap 'Want This' on any reward and I'll start connecting the dots."
            isLoading={isLoading}
            showDivider={true}
          />

          {/* Section 3: Your Ambitions */}
          <Section
            title={`YOUR AMBITIONS${ambitions.length > 0 ? ` (${ambitions.length})` : ''}`}
            items={briefing?.ambitions_enriched ?? []}
            emptyText="Tap 'Want This' on any reward to set your first ambition."
            isLoading={isLoading}
            showDivider={true}
          />

          {/* Ambitions list with remove */}
          {ambitions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
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
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: a.claimable ? '#E2FF6D' : '#5A5A58',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: dmSans,
                    fontSize: '13px',
                    color: '#D9D9D9',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {a.rewardName}
                  </span>
                  <span style={{
                    fontFamily: dmMono,
                    fontSize: '10px',
                    color: a.claimable ? '#E2FF6D' : '#8A8A88',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {a.claimable ? 'Claimable' : (a.distance || 'Locked')}
                  </span>
                  <button
                    onClick={() => removeAmbition(a.rewardId)}
                    style={{
                      fontFamily: dmMono,
                      fontSize: '14px',
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

          {/* Browse rewards link */}
          <button
            onClick={handleBrowseRewards}
            style={{
              fontFamily: dmMono,
              fontSize: '11px',
              color: '#E2FF6D',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginTop: '16px',
              padding: 0,
            }}
          >
            Browse rewards →
          </button>
        </div>
      )}

      {/* FAB Button — matches BH Wingman */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Wingman' : 'Open Wingman'}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 100,
          width: '48px',
          height: '48px',
          background: '#E2FF6D',
          border: 'none',
          borderRadius: '0px',
          boxShadow: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 200ms ease',
          padding: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        <span
          style={{
            fontFamily: dmMono,
            fontSize: '22px',
            fontWeight: 700,
            color: '#0D0D0D',
            lineHeight: 1,
          }}
        >
          N
        </span>
        {/* Ambition count badge */}
        {ambitions.length > 0 && !isOpen && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '18px',
            height: '18px',
            background: '#0D0D0D',
            borderRadius: '0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: dmMono,
            fontSize: '9px',
            color: '#E2FF6D',
            fontWeight: 700,
          }}>
            {ambitions.length}
          </div>
        )}
      </button>
    </>
  );
}
