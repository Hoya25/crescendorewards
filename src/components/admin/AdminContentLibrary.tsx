import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Library, Building2, UserCircle, Users, Clock, Eye, Star, Trash2,
  CheckCircle, XCircle, Plus, Search, Play, Image as ImageIcon,
} from 'lucide-react';
import { getThumbnailFromUrl } from '@/lib/video-thumbnails';

type ContentType = 'video' | 'image' | 'review' | 'tutorial' | 'testimonial' | 'unboxing' | 'tip';
type SourceType = 'sponsor' | 'contributor' | 'member';
type ContentStatus = 'pending' | 'published' | 'rejected' | 'featured';

interface ContentSubmission {
  id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  media_url: string | null;
  thumbnail_url: string | null;
  source_type: SourceType;
  source_id: string | null;
  source_name: string | null;
  reward_id: string | null;
  status: ContentStatus;
  view_count: number;
  is_featured: boolean;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

const SOURCE_CONFIG: Record<SourceType, { label: string; color: string; icon: typeof Building2 }> = {
  sponsor: { label: 'Sponsor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Building2 },
  contributor: { label: 'Contributor', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: UserCircle },
  member: { label: 'Member', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Users },
};

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  published: { label: 'Published', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  featured: { label: 'Featured', color: 'bg-primary/10 text-primary' },
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: 'Video', image: 'Image', review: 'Review', tutorial: 'Tutorial',
  testimonial: 'Testimonial', unboxing: 'Unboxing', tip: 'Tip',
};

export function AdminContentLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '', description: '', content_type: 'video' as ContentType,
    media_url: '', thumbnail_url: '', source_type: 'sponsor' as SourceType,
    source_name: '', status: 'pending' as ContentStatus,
  });

  const { data: content = [], isLoading } = useQuery({
    queryKey: ['admin-content-submissions', sourceFilter, typeFilter, statusFilter, search],
    queryFn: async () => {
      let query = supabase.from('content_submissions').select('*').order('submitted_at', { ascending: false });
      if (sourceFilter !== 'all') query = query.eq('source_type', sourceFilter);
      if (typeFilter !== 'all') query = query.eq('content_type', typeFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (search) query = query.ilike('title', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContentSubmission[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ContentStatus }) => {
      const updates: Record<string, unknown> = { status, reviewed_at: new Date().toISOString() };
      if (status === 'featured') updates.is_featured = true;
      const { error } = await supabase.from('content_submissions').update(updates).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-submissions'] });
      setSelectedIds(new Set());
      toast.success('Content updated');
    },
    onError: () => toast.error('Failed to update content'),
  });

  const addContent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('content_submissions').insert({
        title: newContent.title,
        description: newContent.description || null,
        content_type: newContent.content_type,
        media_url: newContent.media_url || null,
        thumbnail_url: newContent.thumbnail_url || null,
        source_type: newContent.source_type,
        source_name: newContent.source_name || null,
        status: newContent.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-submissions'] });
      setAddDialogOpen(false);
      setNewContent({ title: '', description: '', content_type: 'video', media_url: '', thumbnail_url: '', source_type: 'sponsor', source_name: '', status: 'pending' });
      toast.success('Content added');
    },
    onError: () => toast.error('Failed to add content'),
  });

  const deleteContent = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('content_submissions').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-submissions'] });
      setSelectedIds(new Set());
      toast.success('Content deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const stats = {
    total: content.length,
    sponsors: content.filter(c => c.source_type === 'sponsor').length,
    contributors: content.filter(c => c.source_type === 'contributor').length,
    members: content.filter(c => c.source_type === 'member').length,
    pending: content.filter(c => c.status === 'pending').length,
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === content.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(content.map(c => c.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Library className="h-6 w-6" /> Community Content Library
          </h2>
          <p className="text-muted-foreground mt-1">Content submitted by sponsors, contributors, and members</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Content
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Content', value: stats.total, icon: Library },
          { label: 'From Sponsors', value: stats.sponsors, icon: Building2 },
          { label: 'From Contributors', value: stats.contributors, icon: UserCircle },
          { label: 'From Members', value: stats.members, icon: Users },
          { label: 'Pending Review', value: stats.pending, icon: Clock },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="sponsor">Sponsors</SelectItem>
            <SelectItem value="contributor">Contributors</SelectItem>
            <SelectItem value="member">Members</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ ids: [...selectedIds], status: 'published' })}>
            <CheckCircle className="h-3 w-3 mr-1" /> Approve All
          </Button>
          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ ids: [...selectedIds], status: 'featured' })}>
            <Star className="h-3 w-3 mr-1" /> Feature All
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus.mutate({ ids: [...selectedIds], status: 'rejected' })}>
            <XCircle className="h-3 w-3 mr-1" /> Reject All
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteContent.mutate([...selectedIds])}>
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      )}

      {/* Content Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={selectedIds.size === content.length && content.length > 0} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : content.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No content found. Add your first piece of community content.</TableCell></TableRow>
              ) : (
                content.map(item => {
                  const src = SOURCE_CONFIG[item.source_type];
                  const st = STATUS_CONFIG[item.status];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {(() => {
                              const thumb = item.thumbnail_url || getThumbnailFromUrl(item.media_url);
                              if (thumb) {
                                return (
                                  <img
                                    src={thumb}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                );
                              }
                              return item.content_type === 'video' ? (
                                <Play className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              );
                            })()}
                          </div>
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                            {item.source_name && <p className="text-xs text-muted-foreground">by {item.source_name}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={src.color}>
                          <src.icon className="h-3 w-3 mr-1" />
                          {src.label}
                        </Badge>
                      </TableCell>
                      <TableCell><span className="text-sm">{CONTENT_TYPE_LABELS[item.content_type]}</span></TableCell>
                      <TableCell><Badge variant="secondary" className={st.color}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <span className="text-sm flex items-center gap-1"><Eye className="h-3 w-3" />{item.view_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.submitted_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ ids: [item.id], status: 'published' })}>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ ids: [item.id], status: 'featured' })}>
                                <Star className="h-4 w-4 text-amber-500" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setRejectTargetId(item.id); setRejectDialogOpen(true); }}>
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {item.status === 'published' && (
                            <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ ids: [item.id], status: 'featured' })}>
                              <Star className="h-4 w-4 text-amber-500" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deleteContent.mutate([item.id])}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Content</AlertDialogTitle>
            <AlertDialogDescription>Optionally provide a reason for rejection.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Reason (optional)..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (rejectTargetId) updateStatus.mutate({ ids: [rejectTargetId], status: 'rejected' });
              setRejectDialogOpen(false);
              setRejectReason('');
              setRejectTargetId(null);
            }}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Content Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input value={newContent.title} onChange={e => setNewContent(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={newContent.description} onChange={e => setNewContent(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Content Type</label>
                <Select value={newContent.content_type} onValueChange={v => setNewContent(p => ({ ...p, content_type: v as ContentType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Select value={newContent.source_type} onValueChange={v => setNewContent(p => ({ ...p, source_type: v as SourceType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Source Name</label>
              <Input value={newContent.source_name} onChange={e => setNewContent(p => ({ ...p, source_name: e.target.value }))} placeholder="e.g. Feals, @username" />
            </div>
            <div>
              <label className="text-sm font-medium">Media URL</label>
              <Input value={newContent.media_url} onChange={e => setNewContent(p => ({ ...p, media_url: e.target.value }))} placeholder="YouTube, Vimeo, or direct URL" />
            </div>
            <div>
              <label className="text-sm font-medium">Thumbnail URL</label>
              <Input value={newContent.thumbnail_url} onChange={e => setNewContent(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="Image URL for preview" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => addContent.mutate()} disabled={!newContent.title}>Add Content</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
