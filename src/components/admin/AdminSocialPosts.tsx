import { useState, useMemo } from 'react';
import { useSocialPosts, SocialPost } from '@/hooks/useSocialPosts';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Twitter, Send, Calendar, Pencil, Trash2, ExternalLink, RefreshCw,
  Search, Plus, Settings, AlertCircle, CheckCircle, Clock, XCircle,
  Loader2, Sparkles, Hash, AtSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reward {
  id: string;
  title: string;
  category: string;
  is_active: boolean;
  image_url: string | null;
  auto_post_to_twitter: boolean;
  twitter_post_id: string | null;
}

export function AdminSocialPosts() {
  const {
    posts,
    mentionDefaults,
    loading,
    posting,
    loadPosts,
    createDraft,
    updatePost,
    deletePost,
    postNow,
    generatePostContent,
    updateMentionDefault,
  } = useSocialPosts();

  const [activeTab, setActiveTab] = useState('posts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Post editor
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorMentions, setEditorMentions] = useState<string[]>([]);
  const [editorHashtags, setEditorHashtags] = useState<string[]>([]);
  const [newMention, setNewMention] = useState('');
  const [newHashtag, setNewHashtag] = useState('');

  // Create new post
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string>('');
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPost, setDeletingPost] = useState<SocialPost | null>(null);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = searchTerm === '' ||
        post.post_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.reward?.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [posts, searchTerm, statusFilter]);

  const loadRewardsForCreate = async () => {
    setLoadingRewards(true);
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, title, category, is_active, image_url, auto_post_to_twitter, twitter_post_id')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Failed to load rewards:', error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleOpenCreateModal = () => {
    loadRewardsForCreate();
    setSelectedRewardId('');
    setEditorContent('');
    setEditorMentions([]);
    setEditorHashtags([]);
    setShowCreateModal(true);
  };

  const handleGenerateContent = async () => {
    if (!selectedRewardId) return;
    setGeneratingContent(true);
    const content = await generatePostContent(selectedRewardId);
    if (content) {
      setEditorContent(content);
      // Also set mentions/hashtags from defaults
      const reward = rewards.find(r => r.id === selectedRewardId);
      if (reward) {
        const defaults = mentionDefaults.find(d => d.category === reward.category);
        setEditorMentions(defaults?.default_mentions || []);
        setEditorHashtags(defaults?.default_hashtags || []);
      }
    }
    setGeneratingContent(false);
  };

  const handleCreateDraft = async () => {
    if (!selectedRewardId || !editorContent.trim()) return;
    await createDraft(selectedRewardId, editorContent, editorMentions, editorHashtags);
    setShowCreateModal(false);
    toast({ title: 'Draft created', description: 'Your post draft has been saved.' });
  };

  const handlePostImmediately = async () => {
    if (!selectedRewardId || !editorContent.trim()) return;
    setShowCreateModal(false);
    await postNow(undefined, selectedRewardId, editorContent);
  };

  const handleOpenEditor = (post: SocialPost) => {
    setEditingPost(post);
    setEditorContent(post.post_content);
    setEditorMentions(post.mentions || []);
    setEditorHashtags(post.hashtags || []);
    setShowEditor(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    await updatePost(editingPost.id, {
      post_content: editorContent,
      mentions: editorMentions,
      hashtags: editorHashtags,
    });
    setShowEditor(false);
    setEditingPost(null);
  };

  const handleAddMention = () => {
    if (!newMention.trim()) return;
    const mention = newMention.startsWith('@') ? newMention : `@${newMention}`;
    if (!editorMentions.includes(mention)) {
      setEditorMentions([...editorMentions, mention]);
    }
    setNewMention('');
  };

  const handleAddHashtag = () => {
    if (!newHashtag.trim()) return;
    const hashtag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
    if (!editorHashtags.includes(hashtag)) {
      setEditorHashtags([...editorHashtags, hashtag]);
    }
    setNewHashtag('');
  };

  const handleRemoveMention = (mention: string) => {
    setEditorMentions(editorMentions.filter(m => m !== mention));
  };

  const handleRemoveHashtag = (hashtag: string) => {
    setEditorHashtags(editorHashtags.filter(h => h !== hashtag));
  };

  const handleBulkPost = async () => {
    const selectedPosts = posts.filter(p => selectedIds.has(p.id) && p.status === 'draft');
    for (const post of selectedPosts) {
      await postNow(post.id);
    }
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deletePost(id);
    }
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map(p => p.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Posted</Badge>;
      case 'scheduled':
        return <Badge className="bg-primary/10 text-primary border-primary/20"><Clock className="w-3 h-3 mr-1" /> Scheduled</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border"><Pencil className="w-3 h-3 mr-1" /> Draft</Badge>;
    }
  };

  const charCount = editorContent.length;
  const isOverLimit = charCount > 280;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Twitter className="w-6 h-6" /> Social Posts
          </h2>
          <p className="text-muted-foreground">Manage reward announcements for X/Twitter</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadPosts()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4 mr-2" /> Create Post
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="defaults">Mention Defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button size="sm" variant="outline" onClick={handleBulkPost} disabled={posting}>
                <Send className="w-4 h-4 mr-1" /> Post All
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          )}

          {/* Posts table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedIds.size === filteredPosts.length && filteredPosts.length > 0}
                      onCheckedChange={() => toggleSelectAll()}
                    />
                  </TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead className="min-w-[300px]">Post Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No social posts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(post.id)}
                          onCheckedChange={() => toggleSelection(post.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium truncate max-w-[150px]">
                          {post.reward?.title || 'Unknown Reward'}
                        </div>
                        <div className="text-xs text-muted-foreground">{post.reward?.category}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm line-clamp-2">{post.post_content}</div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {post.mentions?.slice(0, 2).map((m: string) => (
                            <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                          ))}
                          {post.hashtags?.slice(0, 2).map((h: string) => (
                            <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.posted_at
                          ? new Date(post.posted_at).toLocaleDateString()
                          : post.scheduled_for
                            ? `Scheduled: ${new Date(post.scheduled_for).toLocaleDateString()}`
                            : new Date(post.created_at).toLocaleDateString()
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {post.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => postNow(post.id)}
                              disabled={posting}
                            >
                              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                          )}
                          {post.post_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleOpenEditor(post)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => { setDeletingPost(post); setShowDeleteModal(true); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" /> Category Mention Defaults
              </CardTitle>
              <CardDescription>
                Configure default @mentions and #hashtags for each reward category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Default Mentions</TableHead>
                    <TableHead>Default Hashtags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentionDefaults.map((def) => (
                    <TableRow key={def.id}>
                      <TableCell className="font-medium capitalize">{def.category}</TableCell>
                      <TableCell className="text-muted-foreground">{def.subcategory || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {def.default_mentions.map((m: string) => (
                            <Badge key={m} variant="outline">{m}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {def.default_hashtags.map((h: string) => (
                            <Badge key={h} variant="outline">{h}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Post Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Twitter className="w-5 h-5" /> Create Social Post
            </DialogTitle>
            <DialogDescription>
              Create a new X/Twitter post for a reward
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Reward</Label>
              <Select value={selectedRewardId} onValueChange={setSelectedRewardId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingRewards ? 'Loading...' : 'Choose a reward'} />
                </SelectTrigger>
                <SelectContent>
                  {rewards.map((reward) => (
                    <SelectItem key={reward.id} value={reward.id}>
                      {reward.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRewardId && (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateContent}
                    disabled={generatingContent}
                  >
                    {generatingContent ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate Content
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Post Content</Label>
                    <span className={cn("text-xs", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
                      {charCount}/280
                    </span>
                  </div>
                  <Textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    rows={4}
                    placeholder="Write your post content..."
                    className={cn(isOverLimit && "border-destructive")}
                  />
                  {isOverLimit && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Post exceeds 280 character limit
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <AtSign className="w-4 h-4" /> Mentions
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        value={newMention}
                        onChange={(e) => setNewMention(e.target.value)}
                        placeholder="@username"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMention())}
                      />
                      <Button type="button" size="icon" variant="outline" onClick={handleAddMention}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {editorMentions.map((m) => (
                        <Badge key={m} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveMention(m)}>
                          {m} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Hash className="w-4 h-4" /> Hashtags
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        placeholder="#hashtag"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHashtag())}
                      />
                      <Button type="button" size="icon" variant="outline" onClick={handleAddHashtag}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {editorHashtags.map((h) => (
                        <Badge key={h} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveHashtag(h)}>
                          {h} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="outline" onClick={handleCreateDraft} disabled={!selectedRewardId || !editorContent.trim() || isOverLimit}>
              Save as Draft
            </Button>
            <Button onClick={handlePostImmediately} disabled={!selectedRewardId || !editorContent.trim() || isOverLimit || posting}>
              {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Post Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" /> Edit Post
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Post Content</Label>
                <span className={cn("text-xs", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
                  {charCount}/280
                </span>
              </div>
              <Textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                rows={4}
                className={cn(isOverLimit && "border-destructive")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mentions</Label>
                <div className="flex gap-1">
                  <Input
                    value={newMention}
                    onChange={(e) => setNewMention(e.target.value)}
                    placeholder="@username"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMention())}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleAddMention}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {editorMentions.map((m) => (
                    <Badge key={m} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveMention(m)}>
                      {m} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hashtags</Label>
                <div className="flex gap-1">
                  <Input
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    placeholder="#hashtag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHashtag())}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleAddHashtag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {editorHashtags.map((h) => (
                    <Badge key={h} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveHashtag(h)}>
                      {h} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isOverLimit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> Delete Post
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">Are you sure you want to delete this post? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deletingPost) {
                  await deletePost(deletingPost.id);
                  setShowDeleteModal(false);
                  setDeletingPost(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
