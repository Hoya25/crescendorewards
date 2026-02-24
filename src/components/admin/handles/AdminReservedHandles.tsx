import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus, Upload, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

const CATEGORIES = ['brand', 'engine', 'system', 'vip', 'offensive', 'squatting'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<Category, string> = {
  brand: '#3B82F6',
  engine: '#8B5CF6',
  system: '#6B7280',
  vip: '#E2FF6D',
  offensive: '#EF4444',
  squatting: '#F97316',
};

interface ReservedHandle {
  id: string;
  handle: string;
  category: string;
  reason: string | null;
  reserved_for: string | null;
  expires_at: string | null;
  created_at: string | null;
}

interface Props {
  onAction: () => void;
}

export function AdminReservedHandles({ onAction }: Props) {
  const { profile } = useUnifiedUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState<ReservedHandle | null>(null);
  const [editItem, setEditItem] = useState<ReservedHandle | null>(null);

  // Form state
  const [formHandle, setFormHandle] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('system');
  const [formReason, setFormReason] = useState('');
  const [formReservedFor, setFormReservedFor] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [importText, setImportText] = useState('');
  const [importCategory, setImportCategory] = useState<Category>('system');

  const { data: handles = [], isLoading } = useQuery({
    queryKey: ['admin-reserved-handles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reserved_handles')
        .select('*')
        .order('category')
        .order('handle');
      if (error) throw error;
      return data as ReservedHandle[];
    },
  });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = handles.filter(h => h.category === cat).length;
    return acc;
  }, {} as Record<Category, number>);

  const filtered = handles.filter(h => {
    if (categoryFilter !== 'all' && h.category !== categoryFilter) return false;
    if (search && !h.handle.includes(search.toLowerCase())) return false;
    return true;
  });

  const logAudit = async (action: string, targetHandle: string, notes?: string) => {
    if (!profile?.id) return;
    await supabase.from('handle_audit_log').insert({
      admin_user_id: profile.id,
      action,
      target_handle: targetHandle,
      notes,
    });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reserved_handles').insert({
        handle: formHandle.toLowerCase().trim(),
        category: formCategory,
        reason: formReason || null,
        reserved_for: formReservedFor || null,
        expires_at: formExpiresAt || null,
      });
      if (error) throw error;
      await logAudit('add_reserved', formHandle.toLowerCase().trim(), `Category: ${formCategory}`);
    },
    onSuccess: () => {
      toast.success(`Reserved @${formHandle}`);
      queryClient.invalidateQueries({ queryKey: ['admin-reserved-handles'] });
      setShowAdd(false);
      resetForm();
      onAction();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: ReservedHandle) => {
      const { error } = await supabase.from('reserved_handles').delete().eq('id', item.id);
      if (error) throw error;
      await logAudit('remove_reserved', item.handle);
    },
    onSuccess: () => {
      toast.success('Handle unreserved');
      queryClient.invalidateQueries({ queryKey: ['admin-reserved-handles'] });
      setShowDelete(null);
      onAction();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editItem) return;
      const { error } = await supabase.from('reserved_handles').update({
        category: formCategory,
        reason: formReason || null,
        reserved_for: formReservedFor || null,
        expires_at: formExpiresAt || null,
      }).eq('id', editItem.id);
      if (error) throw error;
      await logAudit('add_reserved', editItem.handle, `Updated: ${formCategory}`);
    },
    onSuccess: () => {
      toast.success('Handle updated');
      queryClient.invalidateQueries({ queryKey: ['admin-reserved-handles'] });
      setEditItem(null);
      resetForm();
      onAction();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const items = importText.split(',').map(h => h.trim().toLowerCase()).filter(h => h.length >= 3);
      if (items.length === 0) throw new Error('No valid handles');
      const rows = items.map(handle => ({ handle, category: importCategory, reason: 'Bulk import' }));
      const { error } = await supabase.from('reserved_handles').insert(rows);
      if (error) throw error;
      for (const h of items) await logAudit('add_reserved', h, `Bulk import: ${importCategory}`);
    },
    onSuccess: () => {
      toast.success('Handles imported');
      queryClient.invalidateQueries({ queryKey: ['admin-reserved-handles'] });
      setShowImport(false);
      setImportText('');
      onAction();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setFormHandle('');
    setFormCategory('system');
    setFormReason('');
    setFormReservedFor('');
    setFormExpiresAt('');
  };

  const openEdit = (item: ReservedHandle) => {
    setEditItem(item);
    setFormCategory(item.category as Category);
    setFormReason(item.reason || '');
    setFormReservedFor(item.reserved_for || '');
    setFormExpiresAt(item.expires_at ? item.expires_at.split('T')[0] : '');
  };

  const openAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      {/* Category counts */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <Badge key={cat} variant="outline" className="text-xs cursor-pointer"
                 style={{ borderColor: CATEGORY_COLORS[cat] + '60', color: CATEGORY_COLORS[cat] }}
                 onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}: {categoryCounts[cat]}
          </Badge>
        ))}
        <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setCategoryFilter('all')}>
          Total: {handles.length}
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search handles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} size="sm" style={{ backgroundColor: '#E2FF6D', color: '#323232' }}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
        <Button onClick={() => setShowImport(true)} size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-1" /> Import
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-4 py-3 font-medium">Handle</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Reserved For</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(h => (
                    <tr key={h.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs">@{h.handle}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-[10px]"
                               style={{ borderColor: CATEGORY_COLORS[h.category as Category] + '60', color: CATEGORY_COLORS[h.category as Category] }}>
                          {h.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{h.reason || '—'}</td>
                      <td className="px-4 py-2.5 text-xs">{h.reserved_for || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {h.expires_at ? new Date(h.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(h)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setShowDelete(h)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No handles found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showAdd || !!editItem} onOpenChange={v => { if (!v) { setShowAdd(false); setEditItem(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Reserved Handle' : 'Add Reserved Handle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editItem && (
              <div>
                <Label>Handle</Label>
                <Input value={formHandle} onChange={e => setFormHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="handle_name" />
              </div>
            )}
            <div>
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={v => {
                setFormCategory(v as Category);
                if (v === 'vip' && !formExpiresAt) {
                  const d = new Date(); d.setDate(d.getDate() + 90);
                  setFormExpiresAt(d.toISOString().split('T')[0]);
                }
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason</Label><Input value={formReason} onChange={e => setFormReason(e.target.value)} placeholder="Why is this reserved?" /></div>
            <div><Label>Reserved For (optional)</Label><Input value={formReservedFor} onChange={e => setFormReservedFor(e.target.value)} placeholder="Person or company" /></div>
            <div><Label>Expires At (optional)</Label><Input type="date" value={formExpiresAt} onChange={e => setFormExpiresAt(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditItem(null); resetForm(); }}>Cancel</Button>
            <Button onClick={() => editItem ? updateMutation.mutate() : addMutation.mutate()}
                    disabled={(!editItem && !formHandle) || addMutation.isPending || updateMutation.isPending}
                    style={{ backgroundColor: '#E2FF6D', color: '#323232' }}>
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editItem ? 'Update' : 'Reserve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unreserve @{showDelete?.handle}?</DialogTitle>
            <DialogDescription>This will allow anyone to claim this handle.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDelete && deleteMutation.mutate(showDelete)}
                    disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Unreserve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import Handles</DialogTitle>
            <DialogDescription>Paste comma-separated handles to reserve them all at once.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Category</Label>
              <Select value={importCategory} onValueChange={v => setImportCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Handles (comma-separated)</Label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px]"
                        value={importText} onChange={e => setImportText(e.target.value)}
                        placeholder="handle1, handle2, handle3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button onClick={() => importMutation.mutate()} disabled={!importText || importMutation.isPending}
                    style={{ backgroundColor: '#E2FF6D', color: '#323232' }}>
              {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
