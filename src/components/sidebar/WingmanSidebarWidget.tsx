import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const dmMono = "'DM Mono', monospace";
const dmSans = "'DM Sans', sans-serif";

const CACHE_KEY = 'nctr_crescendo_wingman_briefing';
const CACHE_TTL = 15 * 60 * 1000;

interface BriefingData {
  your_brief: string[];
  spotted: string[];
  ambitions_enriched: string[];
  watching_your_6?: string[];
  opportunities_spotted?: string[];
}

/** Wingman section for the expanded sidebar */
export function WingmanSidebarExpanded() {
  const { user } = useAuthContext();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBriefing = useCallback(async () => {
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
      let result: BriefingData | null = null;

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      );

      try {
        const res = await Promise.race([
          supabase.functions.invoke('bh-status-proxy', {
            body: { action: 'wingman_briefing', user_id: user?.id },
          }),
          timeout,
        ]) as { data: any; error: any };
        const d = res.data;
        if (d?.your_brief || d?.watching_your_6) result = d;
      } catch { /* timeout or network error — use fallback */ }

      if (result) {
        setBriefing(result);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, cached_at: Date.now() }));
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchBriefing(); }, [fetchBriefing]);

  const firstBrief = briefing?.your_brief?.[0] || briefing?.watching_your_6?.[0] || null;

  return (
    <div className="mx-2 p-3 rounded-none bg-[#1A1A1A] border border-[#2A2A2A]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span
          style={{
            fontFamily: dmMono,
            fontSize: '10px',
            color: '#E2FF6D',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}
        >
          WINGMAN
        </span>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#E2FF6D',
            display: 'inline-block',
            animation: 'wingman-dot-pulse 2s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes wingman-dot-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      </div>

      {/* Brief snippet */}
      {isLoading ? (
        <div className="animate-pulse h-3 w-full bg-neutral-700 rounded-none" />
      ) : firstBrief ? (
        <p
          style={{
            fontFamily: dmSans,
            fontSize: '13px',
            color: '#D9D9D9',
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {firstBrief}
        </p>
      ) : (
        <p
          style={{
            fontFamily: dmSans,
            fontSize: '13px',
            color: '#8A8A88',
            fontStyle: 'italic',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Syncing with the ecosystem...
        </p>
      )}
    </div>
  );
}

/** Wingman section for the collapsed sidebar — just the pulsing dot */
export function WingmanSidebarCollapsed() {
  return (
    <div className="flex justify-center py-2" title="Wingman active">
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#E2FF6D',
          display: 'inline-block',
          animation: 'wingman-dot-pulse 2s ease-in-out infinite',
        }}
      />
      <style>{`@keyframes wingman-dot-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
