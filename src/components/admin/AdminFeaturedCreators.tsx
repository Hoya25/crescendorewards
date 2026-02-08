import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, CheckCircle2, ExternalLink } from 'lucide-react';
import { PlatformIcon, PLATFORM_LABELS } from '@/components/creators/PlatformIcon';
import type { FeaturedCreator } from '@/types/creators';
import { cn } from '@/lib/utils';

const PLATFORMS = ['kick', 'youtube', 'spotify', 'patreon', 'instagram', 'tiktok', 'twitter', 'other'];
const CATEGORIES = ['gaming', 'music', 'fitness', 'recovery', 'education', 'entertainment', 'lifestyle', 'tech', 'other'];

const emptyForm = {
  name: '',
  handle: '',
  platform: 'kick',
  profile_url: '',
  image_url: '',
  category: 'entertainment',
  bio: '',
  follower_count: null as number | null,
  is_verified: false,
  is_active: true,
  display_priority: 0,
};

export function AdminFeaturedCreators() {
  const [creators, setCreators] = useState<FeaturedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FeaturedCreator | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [imagePreviewOk, setImagePreviewOk] = useState<boolean | null>(null);

  const loadCreators = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('featured_creators')
      .select('*')
      .order('display_priority', { ascending: false });
    setCreators((data || []) as unknown as FeaturedCreator[]);
    setLoading(false);
  };

  useEffect(() => { loadCreators(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImagePreviewOk(null);
    setShowModal(true);
  };

  const openEdit = (c: FeaturedCreator) => {
    setEditing(c);
    setForm({
      name: c.name,
      handle: c.handle || '',
      platform: c.platform,
      profile_url: c.profile_url || '',
      image_url: c.image_url,
      category: c.category || 'entertainment',
      bio: c.bio || '',
      follower_count: c.follower_count,
      is_verified: c.is_verified,
      is_active: c.is_active,
      display_priority: c.display_priority,
    });
    setImagePreviewOk(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.image_url.trim()) {
      toast({ title: 'Name and Image URL are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      handle: form.handle.trim() || null,
      platform: form.platform,
      profile_url: form.profile_url.trim() || null,
      image_url: form.image_url.trim(),
      category: form.category,
      bio: form.bio.trim() || null,
      follower_count: form.follower_count,
      is_verified: form.is_verified,
      is_active: form.is_active,
      display_priority: form.display_priority,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('featured_creators').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('featured_creators').insert(payload));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editing ? 'Creator updated' : 'Creator added' });
      setShowModal(false);
      loadCreators();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('featured_creators').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Creator deleted' });
      loadCreators();
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    if (action === 'delete') {
      await supabase.from('featured_creators').delete().in('id', ids);
    } else {
      await supabase.from('featured_creators').update({ is_active: action === 'activate' }).in('id', ids);
    }
    setSelected(new Set());
    loadCreators();
    toast({ title: `${ids.length} creators ${action}d` });
  };

  const filtered = creators.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.handle?.toLowerCase().includes(search.toLowerCase())) return false;
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (verifiedFilter && !c.is_verified) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Featured Creators</h2>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Creator</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name or handle..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {PLATFORMS.map(p => <SelectItem key={p} value={p}>{PLATFORM_LABELS[p] || p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Switch checked={verifiedFilter} onCheckedChange={setVerifiedFilter} />
          <span className="text-xs text-muted-foreground">Verified only</span>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>Activate</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>Deactivate</Button>
          <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>Delete</Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={(checked) => {
                    setSelected(checked ? new Set(filtered.map(c => c.id)) : new Set());
                  }}
                />
              </TableHead>
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No creators found</TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <Checkbox checked={selected.has(c.id)} onCheckedChange={(checked) => {
                    const next = new Set(selected);
                    checked ? next.add(c.id) : next.delete(c.id);
                    setSelected(next);
                  }} />
                </TableCell>
                <TableCell>
                  <img src={c.image_url} alt="" className="w-10 h-10 rounded-full object-cover border" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                </TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.handle || '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <PlatformIcon platform={c.platform} size={14} />
                    <span className="text-sm">{PLATFORM_LABELS[c.platform] || c.platform}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize">{c.category || '—'}</TableCell>
                <TableCell>{c.is_verified ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : '—'}</TableCell>
                <TableCell>
                  <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-xs">
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    {c.profile_url && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(c.profile_url!, '_blank')}><ExternalLink className="w-3.5 h-3.5" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Creator' : 'Add Featured Creator'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ian Carroll" />
              </div>
              <div>
                <Label>Handle</Label>
                <Input value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} placeholder="@username" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Platform *</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{PLATFORM_LABELS[p] || p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Profile URL</Label>
              <Input value={form.profile_url} onChange={e => setForm(f => ({ ...f, profile_url: e.target.value }))} placeholder="https://twitch.tv/username" />
            </div>

            <div>
              <Label>Image URL *</Label>
              <Input
                value={form.image_url}
                onChange={e => { setForm(f => ({ ...f, image_url: e.target.value })); setImagePreviewOk(null); }}
                placeholder="https://..."
              />
              {form.image_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className={cn("w-24 h-24 rounded-full object-cover border-2", imagePreviewOk === false ? "border-destructive" : "border-border")}
                    onLoad={() => setImagePreviewOk(true)}
                    onError={() => setImagePreviewOk(false)}
                  />
                  {imagePreviewOk === false && <span className="text-sm text-destructive">❌ Could not load image</span>}
                  {imagePreviewOk === true && <span className="text-sm text-emerald-600">✅ Image loaded</span>}
                </div>
              )}
            </div>

            <div>
              <Label>Bio <span className="text-muted-foreground">({form.bio.length}/150)</span></Label>
              <Textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 150) }))}
                placeholder="Short description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Follower Count</Label>
                <Input type="number" value={form.follower_count ?? ''} onChange={e => setForm(f => ({ ...f, follower_count: e.target.value ? parseInt(e.target.value) : null }))} />
              </div>
              <div>
                <Label>Display Priority</Label>
                <Input type="number" value={form.display_priority} onChange={e => setForm(f => ({ ...f, display_priority: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} />
                <Label>Verified Partnership</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
