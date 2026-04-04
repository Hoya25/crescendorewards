import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ChevronDown, ChevronRight, Brain, Shield } from 'lucide-react';

interface MemoryItem {
  id: string;
  memory: string;
  created_at: string;
  source_hint: 'crescendo' | 'bh' | 'unknown';
}

interface AuditUser {
  user_id: string;
  mem0_memories: MemoryItem[];
  memory_count: number;
  crescendo_memories_count: number;
  bh_memories_count: number;
  mem0_error?: string;
  profile_error?: string;
  crescendo_profile: {
    tier: string | null;
    nctr_locked: number | null;
    lock_upgraded_at: string | null;
    auto_360lock: boolean | null;
    created_at: string;
  } | null;
}

interface AuditResult {
  audit_date: string;
  source_app: string;
  supabase_project: string;
  mem0_key_configured: boolean;
  users_audited: number;
  users: AuditUser[];
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  crescendo: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'CRESCENDO' },
  bh: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'BH' },
  unknown: { bg: 'bg-neutral-500/20', text: 'text-neutral-400', label: 'UNKNOWN' },
};

function MemoryCard({ memory }: { memory: MemoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const source = SOURCE_COLORS[memory.source_hint] || SOURCE_COLORS.unknown;
  const truncated = memory.memory.length > 200;

  return (
    <div
      className="border border-neutral-700 p-3 cursor-pointer hover:border-neutral-500 transition-colors"
      style={{ borderRadius: 0 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wider ${source.bg} ${source.text}`}
          style={{ borderRadius: 0, fontFamily: "'DM Mono', monospace" }}>
          {source.label}
        </span>
        <p className="text-sm text-neutral-300 flex-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {expanded || !truncated ? memory.memory : memory.memory.slice(0, 200) + '…'}
        </p>
        {truncated && (
          expanded ? <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
        )}
      </div>
      {memory.created_at && (
        <p className="text-[10px] text-neutral-600 mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
          {new Date(memory.created_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function UserAuditCard({ user }: { user: AuditUser }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-neutral-700 p-4" style={{ borderRadius: 0 }}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
          <span className="text-sm text-neutral-300" style={{ fontFamily: "'DM Mono', monospace" }}>
            {user.user_id.slice(0, 8)}…{user.user_id.slice(-4)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {user.memory_count} total
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400" style={{ borderRadius: 0, fontFamily: "'DM Mono', monospace" }}>
            {user.crescendo_memories_count} Crescendo
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400" style={{ borderRadius: 0, fontFamily: "'DM Mono', monospace" }}>
            {user.bh_memories_count} BH
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-neutral-500/20 text-neutral-400" style={{ borderRadius: 0, fontFamily: "'DM Mono', monospace" }}>
            {user.memory_count - user.crescendo_memories_count - user.bh_memories_count} Unknown
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Crescendo Profile */}
          {user.crescendo_profile && (
            <div className="bg-neutral-800/50 border border-neutral-700 p-3" style={{ borderRadius: 0 }}>
              <h4 className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                Crescendo Profile
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <div>
                  <span className="text-neutral-500 text-xs">Tier</span>
                  <p className="text-neutral-200">{user.crescendo_profile.tier || '—'}</p>
                </div>
                <div>
                  <span className="text-neutral-500 text-xs">NCTR Locked</span>
                  <p className="text-neutral-200">{user.crescendo_profile.nctr_locked ?? '—'}</p>
                </div>
                <div>
                  <span className="text-neutral-500 text-xs">Lock Upgraded</span>
                  <p className="text-neutral-200">{user.crescendo_profile.lock_upgraded_at ? new Date(user.crescendo_profile.lock_upgraded_at).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <span className="text-neutral-500 text-xs">Joined</span>
                  <p className="text-neutral-200">{new Date(user.crescendo_profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {user.mem0_error && (
            <p className="text-xs text-red-400" style={{ fontFamily: "'DM Mono', monospace" }}>⚠ {user.mem0_error}</p>
          )}
          {user.profile_error && (
            <p className="text-xs text-red-400" style={{ fontFamily: "'DM Mono', monospace" }}>⚠ Profile: {user.profile_error}</p>
          )}

          {/* Memories */}
          <div className="space-y-2">
            {user.mem0_memories.length === 0 ? (
              <p className="text-xs text-neutral-600" style={{ fontFamily: "'DM Mono', monospace" }}>No memories found</p>
            ) : (
              user.mem0_memories.map((m, i) => <MemoryCard key={m.id || i} memory={m} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminWingmanAudit() {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('wingman-crescendo-audit', {
        headers: { 'x-admin-key': 'GODVIEW_INGEST_KEY_PLACEHOLDER' },
        body: {},
      });
      if (fnError) throw fnError;
      setResult(data as AuditResult);
    } catch (e: any) {
      setError(e.message || 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const totalMemories = result?.users.reduce((sum, u) => sum + u.memory_count, 0) ?? 0;
  const totalCrescendo = result?.users.reduce((sum, u) => sum + u.crescendo_memories_count, 0) ?? 0;
  const totalBH = result?.users.reduce((sum, u) => sum + u.bh_memories_count, 0) ?? 0;
  const totalUnknown = totalMemories - totalCrescendo - totalBH;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#323232' }}>
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl md:text-3xl uppercase"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            color: '#E2FF6D',
            letterSpacing: '1px',
          }}
        >
          <Brain className="inline w-6 h-6 mr-2" style={{ color: '#E2FF6D' }} />
          Wingman Memory Audit — Crescendo
        </h1>
        <p className="mt-1 text-sm" style={{ fontFamily: "'DM Mono', monospace", color: '#5A5A58' }}>
          Supabase: yhwcaodofmbusjurawhp | Mem0: Unified Brain (cross-check)
        </p>
      </div>

      {/* Mem0 key warning */}
      {result && !result.mem0_key_configured && (
        <Alert variant="destructive" className="mb-4 border-red-600" style={{ borderRadius: 0 }}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>MEM0_API_KEY NOT SET</AlertTitle>
          <AlertDescription>
            Crescendo cannot read or write to the shared Wingman brain. Configure the MEM0_API_KEY secret to enable cross-app memory.
          </AlertDescription>
        </Alert>
      )}

      {/* Action */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={runAudit}
          disabled={loading}
          className="text-sm font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: '#E2FF6D',
            color: '#1a1a1a',
            borderRadius: 0,
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          {loading ? 'Running…' : 'Run Audit'}
        </Button>
        {result && (
          <span className="text-xs text-neutral-500" style={{ fontFamily: "'DM Mono', monospace" }}>
            Audited {result.users_audited} users at {new Date(result.audit_date).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" style={{ borderRadius: 0, backgroundColor: '#3a3a3a' }} />
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4" style={{ borderRadius: 0 }}>
          <AlertTitle>Audit Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary bar */}
      {result && !loading && (
        <div className="border border-neutral-700 p-4 mb-6 flex flex-wrap gap-6 items-center" style={{ borderRadius: 0 }}>
          <div>
            <span className="text-xs text-neutral-500 block" style={{ fontFamily: "'DM Mono', monospace" }}>Total Memories</span>
            <span className="text-xl font-bold text-neutral-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>{totalMemories}</span>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <span className="block text-lg font-bold text-emerald-400">{totalCrescendo}</span>
              <span className="text-[10px] text-emerald-500" style={{ fontFamily: "'DM Mono', monospace" }}>CRESCENDO</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold text-blue-400">{totalBH}</span>
              <span className="text-[10px] text-blue-500" style={{ fontFamily: "'DM Mono', monospace" }}>BH</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold text-neutral-400">{totalUnknown}</span>
              <span className="text-[10px] text-neutral-500" style={{ fontFamily: "'DM Mono', monospace" }}>UNKNOWN</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: result.mem0_key_configured ? '#E2FF6D' : '#ef4444' }} />
            <span className="text-xs" style={{
              fontFamily: "'DM Mono', monospace",
              color: result.mem0_key_configured ? '#E2FF6D' : '#ef4444',
            }}>
              MEM0: {result.mem0_key_configured ? 'CONFIGURED' : 'NOT SET'}
            </span>
          </div>
        </div>
      )}

      {/* User results */}
      {result && !loading && (
        <div className="space-y-2">
          {result.users.map((user) => (
            <UserAuditCard key={user.user_id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
