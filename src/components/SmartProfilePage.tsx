import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SP } from '@/lib/smartProfileCopy';

// Editorial Light palette — local to this page by spec.
const C = { paper: '#F5F4F0', card: '#FCFBF8', ink: '#131313', line: '#E4E0D5', muted: '#8A8A88', accent: '#C7E25A' };
const TIER_ACCENT: Record<string, string> = {
  bronze: '#CD7F32', silver: '#B6B4AD', gold: '#E0A92E', platinum: '#9FA4A8', diamond: '#6FB7C9',
};
const MIX_ORDER = ['nctr', 'inspiration', 'stardust', 'sweat', 'throttle', 'groundball'];

type MemoryKind = 'brand' | 'goal' | 'you_said' | 'picked';
interface MemoryItem { id: string; kind: MemoryKind; text: string; editable?: boolean }
interface MemoryBlock { lines: MemoryItem[]; hidden_count?: number }
interface SmartProfile {
  status?: 'ok' | 'not_found' | string;
  member?: { handle?: string | null; code?: string | null; addressed_as?: string | null };
  founding?: { is_founding_member?: boolean; since?: string | null };
  status_block?: { tier?: string | null; committed_nctr?: number; committed_since?: string | null; auto_360lock?: boolean };
  checklist?: Record<string, boolean | number>;
  invites?: { signups?: number; committed?: number; circle_rank?: number | null };
  backed_brands?: { name?: string | null; brand_ref?: string | null; since?: string | null }[];
  my_mix?: Record<string, number> | null;
  wishes?: { id?: string; title: string; wish_state?: string; coverage_state?: string; is_north_star?: boolean; created_at?: string }[];
  memory?: MemoryBlock;
}

const TIMEOUT_MS = 10_000;
async function callProxy(body: Record<string, unknown>) {
  const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS));
  const { data, error } = await Promise.race([supabase.functions.invoke('bh-status-proxy', { body }), timeout]);
  if (error) {
    let code: string | undefined;
    try { code = (await (error as { context?: Response }).context?.json())?.error; } catch { /* ignore */ }
    throw new Error(code === 'not_found' || code === 'not_stored' ? code : 'failed');
  }
  if (data?.error === 'not_found' || data?.status === 'not_found') throw new Error('not_found');
  if (data?.error === 'not_stored') throw new Error('not_stored');
  if (data?.error) throw new Error('failed');
  return data;
}

const fmtMonthYear = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const fmtLongDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const heading = "font-['Barlow_Condensed'] uppercase tracking-wide text-2xl";
const label = "font-['DM_Mono'] uppercase text-xs tracking-wider";

function Section({ title, loading, children }: { title?: string; loading: boolean; children: React.ReactNode }) {
  return (
    <Card className="rounded-none shadow-none p-6 space-y-3" style={{ background: C.card, borderColor: C.line, color: C.ink }}>
      {title && <h2 className={heading}>{title}</h2>}
      {loading ? <div className="space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div> : children}
    </Card>
  );
}

export default function SmartProfilePage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery<SmartProfile>({
    queryKey: ['smart-profile'],
    queryFn: () => callProxy({ action: 'smart_profile' }),
    refetchOnWindowFocus: true,
    retry: false,
  });
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notStored, setNotStored] = useState(false);

  const editMemory = async (op: 'edit' | 'remove', id: string, text?: string) => {
    setBusy(true);
    try {
      setNotStored(false);
      const reply = await callProxy({ action: 'smart_profile_memory', op, id, ...(text !== undefined ? { text } : {}) });
      if (reply?.memory) qc.setQueryData<SmartProfile>(['smart-profile'], (prev) => (prev ? { ...prev, memory: reply.memory } : prev));
      setEditing(null);
      setRemoveId(null);
    } catch (e) {
      // not_stored: leave the input open and explain what Wingman keeps.
      if (op === 'edit' && (e as Error).message === 'not_stored') setNotStored(true);
    } finally { setBusy(false); }
  };

  const muted = { color: C.muted };
  const body = "font-['DM_Sans']";

  if (error) {
    return (
      <div style={{ background: C.paper, minHeight: '100%' }}>
        <PageContainer className="py-8 max-w-3xl">
          <Section loading={false}>
            <p className={body}>{(error as Error).message === 'not_found' ? SP.errorNotFound : SP.errorGeneric}</p>
          </Section>
        </PageContainer>
      </div>
    );
  }

  const m = data?.member, st = data?.status_block, inv = data?.invites;
  const tierKey = st?.tier?.toLowerCase() ?? '';
  const steps = SP.launchSteps.map((s) => ({ ...s, done: !!data?.checklist?.[s.key] }));
  const mix = data?.my_mix;
  const mixVals = mix ? MIX_ORDER.filter((k) => k in mix).map((k) => [k, Number(mix[k]) || 0] as const) : [];
    const wishes = [...(data?.wishes ?? [])].sort((a, b) => Number(!!b.is_north_star) - Number(!!a.is_north_star));
  const mem = data?.memory?.lines ?? [];
  const brands = (data?.backed_brands ?? []).map((b) => b?.name).filter((n): n is string => !!n);

  return (
    <div className={body} style={{ background: C.paper, color: C.ink, minHeight: '100%' }}>
      <PageContainer className="py-8 max-w-3xl space-y-4">
        {/* 1 Identity */}
        <Section title={SP.identityHeading} loading={isLoading}>
          {m?.handle && <p className="text-lg">@{m.handle}</p>}
          {m?.code ? (
            <div className="flex items-center gap-3">
              <span className={label} style={muted}>{SP.codeLabel}</span>
              <span className="font-['DM_Mono']">{m.code}</span>
              <Button size="sm" variant="outline" className="rounded-none" style={{ borderColor: C.line, color: C.ink, background: 'transparent' }}
                onClick={() => { navigator.clipboard.writeText(m.code!); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? SP.copied : SP.copy}
              </Button>
            </div>
          ) : <p style={muted}>{SP.claimCode}</p>}
          {data?.founding?.is_founding_member && data.founding.since && (
            <p className={label} style={muted}>{SP.foundingSince(fmtMonthYear(data.founding.since))}</p>
          )}
        </Section>

        {/* 2 Status */}
        <Section loading={isLoading}>
          <p className={label} style={muted}>{SP.statusLabel}</p>
          {st?.tier ? (
            <>
              <p className="font-['Barlow_Condensed'] uppercase text-5xl" style={{ color: TIER_ACCENT[tierKey] ?? C.ink }}>{st.tier}</p>
              <p>{SP.committed((st.committed_nctr ?? 0).toLocaleString('en-US'))}</p>
              {st.committed_since && <p style={muted}>{SP.committingSince(fmtLongDate(st.committed_since))}</p>}
              {st.auto_360lock && <p className={label} style={muted}>{SP.autoLock}</p>}
            </>
          ) : <p>{SP.preBronze}</p>}
        </Section>

        {/* 3 Launch checklist */}
        <Section title={SP.launchHeading} loading={isLoading}>
          <p className={label} style={muted}>{SP.launchDone(steps.filter((s) => s.done).length)}</p>
          <ul className="space-y-2">
            {steps.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                {s.done ? <Check className="w-4 h-4" style={{ color: C.accent }} /> : <Circle className="w-4 h-4" style={muted} />}
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 4 Invites */}
        <Section title={SP.invitesHeading} loading={isLoading}>
          <p>
            {SP.invitesJoined(inv?.signups ?? 0)} · {SP.invitesCommitted(inv?.committed ?? 0)}
            {inv?.circle_rank ? <> · {SP.circleRank(inv.circle_rank)}</> : null}
          </p>
        </Section>

        {/* 5 Brands */}
        <Section title={SP.brandsHeading} loading={isLoading}>
          {brands.length ? <p>{brands.join(' · ')}</p> : <p style={muted}>{SP.brandsEmpty}</p>}
          <a href={SP.mostWantedUrl} target="_blank" rel="noopener noreferrer" className={`${label} underline`}>{SP.mostWanted}</a>
        </Section>

        {/* 6 Mix — read-only bars, no figures */}
        <Section title={SP.mixHeading} loading={isLoading}>
          {mixVals.length ? (
            <div className="space-y-3">
              {mixVals.map(([k, v]) => (
                <div key={k} className="space-y-1">
                  <p className={label} style={muted}>{SP.mixLabels[k]}</p>
                  <div className="h-1 w-full" style={{ background: C.line }}>
                    <div className="h-1" style={{ width: `${Math.min(100, Math.max(0, v))}%`, background: C.accent }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p style={muted}>{SP.mixEmpty}</p>}
        </Section>

        {/* 7 Wishes */}
        {(isLoading || wishes.length > 0) && (
          <Section title={SP.wishesHeading} loading={isLoading}>
            <ul className="space-y-2">
              {wishes.map((w, i) => (
                <li key={w.id ?? i} className="flex flex-wrap items-center gap-2">
                  <span>{w.title}</span>
                  {w.is_north_star && <Badge variant="outline" className="rounded-none" style={{ borderColor: C.ink, color: C.ink }}>{SP.northStar}</Badge>}
                  <Badge variant="outline" className="rounded-none" style={{ borderColor: C.line, color: C.muted }}>
                    {w.coverage_state === 'active' ? SP.wishActive : w.coverage_state === 'scouting' ? SP.wishScouting : SP.wishListed}
                  </Badge>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 8 Memory */}
        <Section title={SP.memoryHeading} loading={isLoading}>
          {m?.addressed_as && <p style={muted}>{SP.addressedAs(m.addressed_as)}</p>}
          {mem.length === 0 ? <p style={muted}>{SP.memoryEmpty}</p> : (
            <div className="space-y-4">
              {(Object.keys(SP.memoryGroups) as MemoryKind[]).map((kind) => {
                const items = mem.filter((x) => x.kind === kind);
                if (!items.length) return null;
                return (
                  <div key={kind} className="space-y-2">
                    <p className={label} style={muted}>{SP.memoryGroups[kind]}</p>
                    {items.map((it) => (
                      <div key={it.id} className="flex flex-wrap items-center gap-2 border-b pb-2" style={{ borderColor: C.line }}>
                        {editing?.id === it.id ? (
                          <>
                            <input className="flex-1 border px-2 py-1 bg-transparent rounded-none" style={{ borderColor: C.line }}
                              maxLength={200} value={editing.text} onChange={(e) => { setNotStored(false); setEditing({ id: it.id, text: e.target.value }); }} />
                            <Button size="sm" className="rounded-none" disabled={busy || !editing.text.trim()} style={{ background: C.ink, color: C.card }}
                              onClick={() => editMemory('edit', it.id, editing.text.trim())}>{SP.save}</Button>
                            <Button size="sm" variant="ghost" className="rounded-none" onClick={() => { setEditing(null); setNotStored(false); }}>{SP.cancel}</Button>
                            {notStored && <p className="w-full text-sm" style={muted}>{SP.memoryNotStored}</p>}
                          </>
                        ) : (
                          <>
                            <span className="flex-1">{it.text}</span>
                            {it.editable && (
                              <>
                                <Button size="sm" variant="ghost" className="rounded-none" onClick={() => { setNotStored(false); setEditing({ id: it.id, text: it.text }); }}>{SP.edit}</Button>
                                <Button size="sm" variant="ghost" className="rounded-none" onClick={() => setRemoveId(it.id)}>{SP.remove}</Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              <p className="text-sm" style={muted}>{SP.memoryFooter}</p>
            </div>
          )}
        </Section>
      </PageContainer>

      <Dialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <DialogContent className="rounded-none" style={{ background: C.card, color: C.ink, borderColor: C.line }}>
          <DialogHeader><DialogTitle className="font-['Barlow_Condensed'] uppercase">{SP.removeConfirm}</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="ghost" className="rounded-none" onClick={() => setRemoveId(null)}>{SP.keep}</Button>
            <Button className="rounded-none" disabled={busy} style={{ background: C.ink, color: C.card }} onClick={() => removeId && editMemory('remove', removeId)}>{SP.remove}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
