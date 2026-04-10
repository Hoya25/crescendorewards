import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { NCTRSquareN } from '@/components/brand/NCTRLogos';

const dmSans = "'DM Sans', sans-serif";
const dmMono = "'DM Mono', monospace";

const BH_FUNCTIONS_BASE = 'https://auibudfactqhisvmiotw.supabase.co/functions/v1';
const SYNC_SECRET = 'nctr-bh-crescendo-sync-2026';

const CACHE_KEY = 'nctr_crescendo_wingman_briefing';
const CACHE_TTL = 15 * 60 * 1000;

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

type Tab = 'ask' | 'feedback';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const wingmanCSS = `
@keyframes wingman-slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
@keyframes wingman-dot-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.wingman-fab-button {
  border-radius: 0px !important;
  border-top-left-radius: 0px !important;
  border-top-right-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
  box-shadow: none !important;
}
`;

async function fetchBhWingman(userId: string, question?: string): Promise<BriefingData> {
  // Try admin-api with wingman_briefing action first
  try {
    const res = await fetch(`${BH_FUNCTIONS_BASE}/admin-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': SYNC_SECRET,
      },
      body: JSON.stringify({ action: 'wingman_briefing', user_id: userId, question }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.your_brief || data.watching_your_6) return data as BriefingData;
    }
  } catch { /* fall through */ }

  // Fallback: call BH wingman-briefing directly
  try {
    const res = await fetch(`${BH_FUNCTIONS_BASE}/wingman-briefing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': SYNC_SECRET,
      },
      body: JSON.stringify({ user_id: userId, question }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.your_brief || data.watching_your_6) return data as BriefingData;
    }
  } catch { /* ignore */ }

  return FALLBACK;
}

export function WingmanFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('ask');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const { user } = useAuthContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollYRef = useRef(0);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollYRef.current}px`;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchBriefing = useCallback(async () => {
    if (!user?.id) return;
    // Check cache
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
      const data = await fetchBhWingman(user.id);
      setBriefing(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cached_at: Date.now() }));
    } catch {
      setBriefing(FALLBACK);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && !briefing) fetchBriefing();
  }, [isOpen, briefing, fetchBriefing]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || !user?.id) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);
    try {
      const data = await fetchBhWingman(user.id, q);
      const reply = data.your_brief?.[0] || data.spotted?.[0] || "I'm processing that — check back shortly.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection interrupted. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, user?.id]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setBriefing(null);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const brief = briefing?.your_brief || briefing?.watching_your_6 || [];
  const spotted = briefing?.spotted || briefing?.opportunities_spotted || [];

  return (
    <>
      <style>{wingmanCSS}</style>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.5)' }}
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
            background: '#131313',
            borderTop: '1px solid #323232',
            maxHeight: '70vh',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            animation: 'wingman-slide-up 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        >
          {/* WINGMAN label + green dot + handle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px 0' }}>
            <span style={{ fontFamily: dmMono, fontSize: '10px', color: '#E2FF6D', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 500 }}>WINGMAN</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E2FF6D', animation: 'wingman-dot-pulse 2s ease-in-out infinite' }} />
            {user?.email && (
              <span style={{ fontFamily: dmMono, fontSize: '10px', color: '#5A5A58', marginLeft: '4px' }}>@{user.email.split('@')[0]}</span>
            )}
          </div>
          {/* Top bar: tabs + controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 0',
            flexShrink: 0,
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '20px' }}>
              {(['ask', 'feedback'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    fontFamily: dmMono,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: tab === t ? '#E2FF6D' : '#5A5A58',
                    background: 'none',
                    border: 'none',
                    borderBottom: tab === t ? '2px solid #E2FF6D' : '2px solid transparent',
                    cursor: 'pointer',
                    paddingBottom: '8px',
                    fontWeight: 500,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={handleClear}
                style={{
                  fontFamily: dmMono,
                  fontSize: '10px',
                  color: '#5A5A58',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                CLEAR
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  fontFamily: dmSans,
                  fontSize: '20px',
                  color: '#5A5A58',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#2A2A2A', margin: '0 20px' }} />

          {/* Content area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              overscrollBehavior: 'contain' as const,
              WebkitOverflowScrolling: 'touch',
              padding: '16px 20px',
            }}
          >
            {tab === 'ask' ? (
              <>
                {/* Briefing sections when no messages */}
                {messages.length === 0 && (
                  <>
                    {isLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse" style={{ height: '13px', background: 'rgba(90,90,88,0.2)', width: i === 3 ? '60%' : '100%' }} />
                        ))}
                      </div>
                    ) : (
                      <>
                        {brief.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontFamily: dmMono, fontSize: '11px', color: '#E2FF6D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>YOUR BRIEF</div>
                            {brief.map((item, i) => (
                              <div key={i} style={{ fontFamily: dmSans, fontSize: '13px', color: '#D9D9D9', lineHeight: 1.6, marginBottom: '6px', padding: '10px 14px', background: '#1A1A1A', borderRadius: '0px' }}>
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                        {spotted.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontFamily: dmMono, fontSize: '11px', color: '#E2FF6D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>SPOTTED</div>
                            {spotted.map((item, i) => (
                              <div key={i} style={{ fontFamily: dmSans, fontSize: '13px', color: '#D9D9D9', lineHeight: 1.6, marginBottom: '6px', padding: '10px 14px', background: '#1A1A1A', borderRadius: '0px' }}>
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Message bubbles */}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '10px',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '10px 14px',
                        background: msg.role === 'user' ? '#E2FF6D' : '#1A1A1A',
                        color: msg.role === 'user' ? '#0D0D0D' : '#D9D9D9',
                        fontFamily: dmSans,
                        fontSize: '13px',
                        lineHeight: 1.6,
                        borderRadius: '0px',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && messages.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                    <div className="animate-pulse" style={{ padding: '10px 14px', background: '#1A1A1A', fontFamily: dmSans, fontSize: '13px', color: '#5A5A58' }}>
                      Thinking...
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Feedback tab */
              <div style={{ fontFamily: dmSans, fontSize: '13px', color: '#8A8A88', fontStyle: 'italic', padding: '20px 0' }}>
                Feedback coming soon. Use ASK to talk to your Wingman.
              </div>
            )}
          </div>

          {/* Input bar */}
          {tab === 'ask' && (
            <div style={{
              padding: '12px 20px 16px',
              borderTop: '1px solid #2A2A2A',
              display: 'flex',
              gap: '10px',
              flexShrink: 0,
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder="What do you care about? Goals, interests..."
                style={{
                  flex: 1,
                  fontFamily: dmSans,
                  fontSize: '13px',
                  color: '#D9D9D9',
                  background: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '0px',
                  padding: '10px 14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  fontFamily: dmMono,
                  fontSize: '11px',
                  color: '#0D0D0D',
                  background: input.trim() ? '#E2FF6D' : '#2A2A2A',
                  border: 'none',
                  borderRadius: '0px',
                  padding: '10px 16px',
                  cursor: input.trim() ? 'pointer' : 'default',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* DESIGN RULE: border-radius: 0 everywhere */}
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Wingman' : 'Open Wingman'}
        className="wingman-fab-button"
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 100,
          width: '48px',
          height: '48px',
          minWidth: '48px',
          minHeight: '48px',
          maxWidth: '48px',
          maxHeight: '48px',
          background: '#E2FF6D',
          border: 'none',
          borderRadius: '0px !important',
          borderTopLeftRadius: '0px',
          borderTopRightRadius: '0px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
          boxShadow: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
         <NCTRSquareN size={24} fillColor="#0D0D0D" />
      </button>
    </>
  );
}
