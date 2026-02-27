import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Plus, Edit2, Copy, Trash2, Check, X, Target, TrendingUp, Clock, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────
interface BountyRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string | null;
  nctr_reward: number;
  xp_reward: number | null;
  requires_360lock: boolean | null;
  lock_multiplier: number | null;
  min_status_required: string | null;
  bounty_tier: string | null;
  requires_purchase: boolean | null;
  max_completions: number | null;
  is_recurring: boolean | null;
  recurrence_period: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  total_completions: number | null;
  image_emoji: string | null;
  cta_text: string | null;
  instructions: string | null;
  completion_message: string | null;
  created_at: string | null;
  status: 'active' | 'paused' | 'hidden';
  is_wide: boolean | null;
  cap_per_month: number | null;
  progress_target: number | null;
  sort_order: number | null;
  multiplier_type: string | null;
  multiplier_value: number | null;
  multiplier_status_tiers: Record<string, number> | null;
}

interface ClaimRow {
  id: string;
  bounty_id: string;
  user_id: string;
  status: string;
  nctr_earned: number;
  multiplier_applied: number | null;
  locked_to_360: boolean | null;
  submission_url: string | null;
  submission_notes: string | null;
  admin_notes: string | null;
  completed_at: string | null;
  created_at: string | null;
  bounty?: { title: string } | null;
}

const DEFAULT_STATUS_TIERS: Record<string, number> = {
  Bronze: 1, Silver: 1.5, Gold: 2, Platinum: 2.5, Diamond: 3,
};

const TIER_COLORS_MAP: Record<string, string> = {
  Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Platinum: '#E5E4E2', Diamond: '#B9F2FF',
};

const EMPTY_FORM: Partial<BountyRow> = {
  title: '',
  description: '',
  category: 'shopping',
  difficulty: 'medium',
  nctr_reward: 0,
  xp_reward: 0,
  requires_360lock: true,
  lock_multiplier: 3.0,
  min_status_required: null,
  bounty_tier: 'general',
  requires_purchase: false,
  max_completions: null,
  is_recurring: false,
  recurrence_period: null,
  is_active: true,
  is_featured: false,
  image_emoji: null,
  cta_text: 'Claim This Bounty',
  instructions: null,
  completion_message: null,
  status: 'active',
  is_wide: false,
  cap_per_month: null,
  progress_target: null,
  sort_order: 0,
  multiplier_type: null,
  multiplier_value: null,
  multiplier_status_tiers: null,
};

const BOARD_CATEGORIES = [
  { value: 'shopping', label: 'Shopping' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social' },
  { value: 'engagement', label: 'Engagement' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
};

const TIER_LABELS: Record<string, string> = {
  general: 'General',
  recurring: 'Recurring',
  merch_tier1: 'Merch Tier 1',
  merch_tier2: 'Merch Tier 2',
  merch_tier3: 'Merch Tier 3',
};

const STATUS_LABELS: Record<string, string> = {
  '': 'All Members',
  bronze: 'Bronze+',
  silver: 'Silver+',
  gold: 'Gold+',
  platinum: 'Platinum+',
  diamond: 'Diamond',
};

// ─── Component ───────────────────────────────────────────────────────
export function AdminBounties() {
  const qc = useQueryClient();

  // ── State ──
  const [tab, setTab] = useState('bounties');
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'nctr_reward' | 'total_completions' | 'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<BountyRow>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [claimFilterStatus, setClaimFilterStatus] = useState('all');
  const [claimSearch, setClaimSearch] = useState('');

  // Inline NCTR editing
  const [editingNctrId, setEditingNctrId] = useState<string | null>(null);
  const [editingNctrValue, setEditingNctrValue] = useState('');
  // ── Queries ──
  const { data: bounties = [], isLoading: loadingBounties } = useQuery({
    queryKey: ['admin-bounties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bounties').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as BountyRow[];
    },
  });

  const { data: claims = [], isLoading: loadingClaims } = useQuery({
    queryKey: ['admin-bounty-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bounty_claims')
        .select('*, bounty:bounties(title)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClaimRow[];
    },
  });

  // ── Stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      activeBounties: bounties.filter(b => b.status === 'active').length,
      claimsThisWeek: claims.filter(c => c.created_at && new Date(c.created_at) >= weekAgo).length,
      pendingClaims: claims.filter(c => c.status === 'pending').length,
      totalNctr: claims.filter(c => c.status === 'completed' || c.status === 'approved').reduce((s, c) => s + (c.nctr_earned || 0), 0),
      pausedBounties: bounties.filter(b => b.status === 'paused').length,
      hiddenBounties: bounties.filter(b => b.status === 'hidden').length,
    };
  }, [bounties, claims]);

  // ── Filtered / sorted bounties ──
  const filteredBounties = useMemo(() => {
    let list = [...bounties];
    if (search) list = list.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
    if (filterDifficulty !== 'all') list = list.filter(b => b.difficulty === filterDifficulty);
    if (filterTier !== 'all') list = list.filter(b => b.bounty_tier === filterTier);
    if (filterStatus !== 'all') list = list.filter(b => (b.min_status_required || '') === (filterStatus === 'none' ? '' : filterStatus));
    if (filterActive !== 'all') list = list.filter(b => b.status === filterActive);
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title);
      if (sortBy === 'nctr_reward') return dir * ((a.nctr_reward || 0) - (b.nctr_reward || 0));
      if (sortBy === 'total_completions') return dir * ((a.total_completions || 0) - (b.total_completions || 0));
      return dir * ((a.created_at || '').localeCompare(b.created_at || ''));
    });
    return list;
  }, [bounties, search, filterDifficulty, filterTier, filterStatus, filterActive, sortBy, sortDir]);

  // ── Filtered claims ──
  const filteredClaims = useMemo(() => {
    let list = [...claims];
    if (claimFilterStatus !== 'all') list = list.filter(c => c.status === claimFilterStatus);
    if (claimSearch) list = list.filter(c =>
      (c.bounty as any)?.title?.toLowerCase().includes(claimSearch.toLowerCase()) ||
      c.user_id.includes(claimSearch)
    );
    return list;
  }, [claims, claimFilterStatus, claimSearch]);

  // ── Mutations ──
  const saveBounty = useMutation({
    mutationFn: async (data: Partial<BountyRow>) => {
      if (editingId) {
        const { error } = await supabase.from('bounties').update(data as any).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bounties').insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bounties'] });
      toast.success(editingId ? 'Bounty updated' : 'Bounty created');
      setFormOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateBountyStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' | 'hidden' }) => {
      const { error } = await supabase.from('bounties').update({ status, is_active: status === 'active' } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-bounties'] }),
    onError: (e: any) => toast.error(e.message),
  });

  const inlineUpdateNctr = useMutation({
    mutationFn: async ({ id, nctr_reward }: { id: string; nctr_reward: number }) => {
      const { error } = await supabase.from('bounties').update({ nctr_reward } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bounties'] });
      toast.success('NCTR amount updated');
      setEditingNctrId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteBounty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bounties').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bounties'] });
      toast.success('Bounty deleted');
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateClaimStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'completed' || status === 'approved') updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from('bounty_claims').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bounty-claims'] });
      toast.success('Claim status updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Handlers ──
  const openNew = () => { setEditingId(null); setFormData({ ...EMPTY_FORM }); setFormOpen(true); };
  const openEdit = (b: BountyRow) => { setEditingId(b.id); setFormData({ ...b }); setFormOpen(true); };
  const openDuplicate = (b: BountyRow) => {
    setEditingId(null);
    setFormData({ ...b, id: undefined, title: b.title + ' (copy)', total_completions: 0, created_at: undefined } as any);
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.title?.trim()) { toast.error('Title is required'); return; }
    if (!formData.nctr_reward && formData.nctr_reward !== 0) { toast.error('NCTR reward is required'); return; }
    const { id, total_completions, created_at, ...rest } = formData as any;
    saveBounty.mutate(editingId ? rest : rest);
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6" /> Bounties</h2>
          <p className="text-muted-foreground text-sm">Manage bounties and review claims</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Bounty</Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Bounties', value: stats.activeBounties, icon: Target, color: 'text-green-600' },
          { label: 'Claims This Week', value: stats.claimsThisWeek, icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Pending Review', value: stats.pendingClaims, icon: Clock, color: 'text-yellow-600' },
          { label: 'NCTR Distributed', value: stats.totalNctr.toLocaleString(), icon: Award, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <s.icon className={cn('w-4 h-4', s.color)} /> {s.label}
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="bounties">Bounties</TabsTrigger>
          <TabsTrigger value="claims">
            Claims {stats.pendingClaims > 0 && <Badge variant="destructive" className="ml-1 text-xs">{stats.pendingClaims}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ──── Bounties Tab ──── */}
        <TabsContent value="bounties" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search bounties..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulty</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {Object.entries(TIER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status Req" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="none">All Members</SelectItem>
                <SelectItem value="silver">Silver+</SelectItem>
                <SelectItem value="gold">Gold+</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Active" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('title')}>Title {sortBy === 'title' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('nctr_reward')}>NCTR {sortBy === 'nctr_reward' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('total_completions')}>Claims {sortBy === 'total_completions' && (sortDir === 'asc' ? '↑' : '↓')}</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBounties ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : filteredBounties.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No bounties found</TableCell></TableRow>
                ) : filteredBounties.map(b => (
                  <TableRow key={b.id} className={b.status === 'hidden' ? 'opacity-40' : b.status === 'paused' ? 'opacity-70' : ''}>
                    <TableCell>
                      <button onClick={() => openEdit(b)} className="text-left font-medium hover:text-primary transition-colors">
                        {b.image_emoji && <span className="mr-1">{b.image_emoji}</span>}
                        {b.title}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs capitalize">{b.category}</TableCell>
                    <TableCell>
                      {editingNctrId === b.id ? (
                        <Input
                          type="number"
                          className="w-24 h-7 text-xs font-mono"
                          value={editingNctrValue}
                          onChange={e => setEditingNctrValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              inlineUpdateNctr.mutate({ id: b.id, nctr_reward: Number(editingNctrValue) });
                            } else if (e.key === 'Escape') {
                              setEditingNctrId(null);
                            }
                          }}
                          onBlur={() => setEditingNctrId(null)}
                          autoFocus
                        />
                      ) : (
                        <button
                          className="font-mono hover:text-primary transition-colors cursor-pointer"
                          onClick={() => { setEditingNctrId(b.id); setEditingNctrValue(String(b.nctr_reward)); }}
                        >
                          {Number(b.nctr_reward).toLocaleString()}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', DIFFICULTY_COLORS[b.difficulty || 'medium'])}>
                        {b.difficulty || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {b.multiplier_type === 'status_based' ? (() => {
                        const tiers = b.multiplier_status_tiers as Record<string, number> | null;
                        if (!tiers) return 'Status: 1x–3x';
                        const vals = Object.values(tiers);
                        return `Status: ${Math.min(...vals)}x–${Math.max(...vals)}x`;
                      })() : b.multiplier_type === 'flat_bonus' ? `${b.multiplier_value || 2}x Bonus` : '—'}
                    </TableCell>
                    <TableCell>
                      <Select value={b.status || 'active'} onValueChange={(v: 'active' | 'paused' | 'hidden') => updateBountyStatus.mutate({ id: b.id, status: v })}>
                        <SelectTrigger className={cn('w-[100px] h-7 text-xs font-semibold', {
                          'text-green-500 border-green-500/30': b.status === 'active',
                          'text-yellow-500 border-yellow-500/30': b.status === 'paused',
                          'text-red-500 border-red-500/30': b.status === 'hidden',
                        })}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">{b.is_recurring ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {b.total_completions || 0}{b.max_completions ? ` / ${b.max_completions}` : ''}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openDuplicate(b)}><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ──── Claims Tab ──── */}
        <TabsContent value="claims" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by bounty title or user…" value={claimSearch} onChange={e => setClaimSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={claimFilterStatus} onValueChange={setClaimFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bounty</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>NCTR Earned</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Submission</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingClaims ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : filteredClaims.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No claims found</TableCell></TableRow>
                ) : filteredClaims.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{(c.bounty as any)?.title || c.bounty_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs font-mono">{c.user_id.slice(0, 12)}…</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'pending' ? 'secondary' : c.status === 'completed' ? 'default' : 'destructive'} className="text-xs">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{Number(c.nctr_earned).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {c.submission_url ? <a href={c.submission_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Link</a> : '—'}
                      {c.submission_notes && <span className="ml-1 text-muted-foreground">{c.submission_notes}</span>}
                    </TableCell>
                    <TableCell>
                      {c.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateClaimStatus.mutate({ id: c.id, status: 'completed' })}>
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateClaimStatus.mutate({ id: c.id, status: 'rejected' })}>
                            <X className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ──── Form Dialog ──── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Bounty' : 'New Bounty'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={formData.title || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea value={formData.description || ''} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Board Category</Label>
                <Select value={formData.category || 'shopping'} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOARD_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select value={formData.difficulty || 'medium'} onValueChange={v => setFormData(p => ({ ...p, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Base NCTR Reward *</Label>
                <Input type="number" value={formData.nctr_reward ?? 0} onChange={e => setFormData(p => ({ ...p, nctr_reward: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label>XP Reward</Label>
                <Input type="number" value={formData.xp_reward ?? 0} onChange={e => setFormData(p => ({ ...p, xp_reward: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={!!formData.requires_360lock} onCheckedChange={v => setFormData(p => ({ ...p, requires_360lock: v }))} />
                <Label>Requires 360LOCK</Label>
              </div>
              <div className="grid gap-2">
                <Label>Lock Multiplier</Label>
                <Input type="number" step="0.1" value={formData.lock_multiplier ?? 3.0} onChange={e => setFormData(p => ({ ...p, lock_multiplier: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Min Status Required</Label>
                <Select value={formData.min_status_required || 'none'} onValueChange={v => setFormData(p => ({ ...p, min_status_required: v === 'none' ? null : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Members</SelectItem>
                    <SelectItem value="bronze">Bronze+</SelectItem>
                    <SelectItem value="silver">Silver+</SelectItem>
                    <SelectItem value="gold">Gold+</SelectItem>
                    <SelectItem value="platinum">Platinum+</SelectItem>
                    <SelectItem value="diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Bounty Tier</Label>
                <Select value={formData.bounty_tier || 'general'} onValueChange={v => setFormData(p => ({ ...p, bounty_tier: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={!!formData.requires_purchase} onCheckedChange={v => setFormData(p => ({ ...p, requires_purchase: v }))} />
                <Label>Requires Purchase</Label>
              </div>
              <div className="grid gap-2">
                <Label>Max Claims (0 = unlimited)</Label>
                <Input type="number" value={formData.max_completions ?? 0} onChange={e => setFormData(p => ({ ...p, max_completions: Number(e.target.value) || null }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={!!formData.is_recurring} onCheckedChange={v => setFormData(p => ({ ...p, is_recurring: v, recurrence_period: v ? 'weekly' : null }))} />
                <Label>Is Recurring</Label>
              </div>
              {formData.is_recurring && (
                <div className="grid gap-2">
                  <Label>Recurrence Period</Label>
                  <Select value={formData.recurrence_period || 'weekly'} onValueChange={v => setFormData(p => ({ ...p, recurrence_period: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Emoji Icon</Label>
                <Input value={formData.image_emoji || ''} onChange={e => setFormData(p => ({ ...p, image_emoji: e.target.value || null }))} placeholder="🎯" />
              </div>
              <div className="grid gap-2">
                <Label>CTA Text</Label>
                <Input value={formData.cta_text || ''} onChange={e => setFormData(p => ({ ...p, cta_text: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Instructions</Label>
              <Textarea value={formData.instructions || ''} onChange={e => setFormData(p => ({ ...p, instructions: e.target.value || null }))} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Completion Message</Label>
              <Textarea value={formData.completion_message || ''} onChange={e => setFormData(p => ({ ...p, completion_message: e.target.value || null }))} rows={2} />
            </div>
            {/* ── Bounty Board layout fields ── */}
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-semibold text-muted-foreground mb-3">Bounty Board Layout</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch checked={!!formData.is_wide} onCheckedChange={v => setFormData(p => ({ ...p, is_wide: v }))} />
                  <Label>Wide Card (full width)</Label>
                </div>
                <div className="grid gap-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={formData.sort_order ?? 0} onChange={e => setFormData(p => ({ ...p, sort_order: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="grid gap-2">
                  <Label>Cap Per Month (0 = none)</Label>
                  <Input type="number" value={formData.cap_per_month ?? ''} onChange={e => setFormData(p => ({ ...p, cap_per_month: Number(e.target.value) || null }))} placeholder="e.g. 4" />
                </div>
                <div className="grid gap-2">
                  <Label>Progress Target (0 = none)</Label>
                  <Input type="number" value={formData.progress_target ?? ''} onChange={e => setFormData(p => ({ ...p, progress_target: Number(e.target.value) || null }))} placeholder="e.g. 5" />
                </div>
              </div>
            </div>

            {/* ── Multiplier System ── */}
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-semibold text-muted-foreground mb-3">Multiplier System</p>
              <div className="grid gap-2">
                <Label>Multiplier Type</Label>
                <Select value={formData.multiplier_type || 'none'} onValueChange={v => {
                  const mt = v === 'none' ? null : v;
                  setFormData(p => ({
                    ...p,
                    multiplier_type: mt,
                    multiplier_value: mt === 'flat_bonus' ? (p.multiplier_value || 2) : null,
                    multiplier_status_tiers: mt === 'status_based' ? (p.multiplier_status_tiers || DEFAULT_STATUS_TIERS) : null,
                  }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — flat amount, no multiplier</SelectItem>
                    <SelectItem value="status_based">Status Based — scales with Crescendo tier</SelectItem>
                    <SelectItem value="flat_bonus">Flat Bonus — fixed multiplier for all users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.multiplier_type === 'status_based' && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Tier Multipliers</Label>
                  <div className="grid gap-2 rounded-lg border p-3 bg-muted/30">
                    {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map(tier => (
                      <div key={tier} className="flex items-center gap-3">
                        <span className="text-sm font-bold w-20" style={{ color: TIER_COLORS_MAP[tier] }}>{tier}</span>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          className="w-24 h-8 text-sm font-mono"
                          value={(formData.multiplier_status_tiers as any)?.[tier] ?? DEFAULT_STATUS_TIERS[tier]}
                          onChange={e => {
                            const current = (formData.multiplier_status_tiers || DEFAULT_STATUS_TIERS) as Record<string, number>;
                            setFormData(p => ({ ...p, multiplier_status_tiers: { ...current, [tier]: Number(e.target.value) } }));
                          }}
                        />
                        <span className="text-xs text-muted-foreground">×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.multiplier_type === 'flat_bonus' && (
                <div className="mt-3 grid gap-2">
                  <Label>Multiplier Value</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    className="w-32"
                    value={formData.multiplier_value ?? 2}
                    onChange={e => setFormData(p => ({ ...p, multiplier_value: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">e.g. 2.0 means users earn 2× the base NCTR</p>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Visibility Status</Label>
              <Select value={formData.status || 'active'} onValueChange={(v: 'active' | 'paused' | 'hidden') => setFormData(p => ({ ...p, status: v, is_active: v === 'active' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active — visible on Bounty Board</SelectItem>
                  <SelectItem value="paused">Paused — hidden from board, data preserved</SelectItem>
                  <SelectItem value="hidden">Hidden — completely removed from board</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveBounty.isPending}>
              {saveBounty.isPending ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── Delete Confirm ──── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bounty?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. All associated claims will remain.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteBounty.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
