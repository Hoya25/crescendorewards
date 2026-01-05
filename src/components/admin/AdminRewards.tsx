import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Lock, 
  MoreHorizontal, Copy, ExternalLink, Gift, ChevronUp, ChevronDown,
  Minus, Search, Star, AlertTriangle, Heart, ShoppingCart, Package
} from 'lucide-react';
import { validateImageFile } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { cn } from '@/lib/utils';

interface Reward {
  id: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  stock_quantity: number | null;
  is_active: boolean;
  image_url: string | null;
  is_featured: boolean;
  token_gated: boolean;
  token_contract_address: string | null;
  minimum_token_balance: number;
  token_name: string | null;
  token_symbol: string | null;
  created_at: string;
  claim_count?: number;
  wishlist_count?: number;
  brand_id?: string | null;
}

interface Brand {
  id: string;
  name: string;
}

type SortField = 'title' | 'cost' | 'stock_quantity' | 'claim_count' | 'wishlist_count' | 'created_at';
type SortDirection = 'asc' | 'desc';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'alliance_tokens', label: 'Alliance Tokens' },
  { value: 'experiences', label: 'Experiences' },
  { value: 'merch', label: 'Merchandise' },
  { value: 'gift_cards', label: 'Gift Cards' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'opportunity', label: 'Opportunity' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'featured', label: 'Featured' },
  { value: 'low_stock', label: 'Low Stock (<5)' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export function AdminRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Gift modal
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftReward, setGiftReward] = useState<Reward | null>(null);
  const [giftUserSearch, setGiftUserSearch] = useState('');
  const [giftUsers, setGiftUsers] = useState<any[]>([]);
  const [selectedGiftUser, setSelectedGiftUser] = useState<any>(null);
  const [giftingInProgress, setGiftingInProgress] = useState(false);
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReward, setDeleteReward] = useState<Reward | null>(null);
  const [deleteClaimCount, setDeleteClaimCount] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'alliance_tokens',
    cost: 0,
    stock_quantity: null as number | null,
    is_active: true,
    image_url: null as string | null,
    is_featured: false,
    token_gated: false,
    token_contract_address: null as string | null,
    minimum_token_balance: 1,
    token_name: null as string | null,
    token_symbol: null as string | null,
    brand_id: null as string | null,
  });

  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    loadRewards();
    loadBrands();
  }, []);

  const loadBrands = async () => {
    const { data } = await supabase
      .from('brands')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setBrands(data || []);
  };

  const loadRewards = async () => {
    try {
      setLoading(true);
      
      // Fetch rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false });

      if (rewardsError) throw rewardsError;

      // Fetch claim counts
      const { data: claimsData } = await supabase
        .from('rewards_claims')
        .select('reward_id');

      // Fetch wishlist counts
      const { data: wishlistData } = await supabase
        .from('reward_wishlists')
        .select('reward_id');

      // Calculate counts
      const claimCounts = (claimsData || []).reduce((acc, claim) => {
        acc[claim.reward_id] = (acc[claim.reward_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const wishlistCounts = (wishlistData || []).reduce((acc, wishlist) => {
        acc[wishlist.reward_id] = (acc[wishlist.reward_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Merge data
      const enrichedRewards = (rewardsData || []).map(reward => ({
        ...reward,
        claim_count: claimCounts[reward.id] || 0,
        wishlist_count: wishlistCounts[reward.id] || 0,
      }));

      setRewards(enrichedRewards);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load rewards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted rewards
  const filteredRewards = useMemo(() => {
    let filtered = rewards.filter(reward => {
      // Search filter
      if (searchTerm && !reward.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (categoryFilter !== 'all' && reward.category !== categoryFilter) {
        return false;
      }
      
      // Status filter
      switch (statusFilter) {
        case 'active':
          if (!reward.is_active) return false;
          break;
        case 'inactive':
          if (reward.is_active) return false;
          break;
        case 'featured':
          if (!reward.is_featured) return false;
          break;
        case 'low_stock':
          if (reward.stock_quantity === null || reward.stock_quantity >= 5) return false;
          break;
        case 'out_of_stock':
          if (reward.stock_quantity === null || reward.stock_quantity > 0) return false;
          break;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      // Handle nulls
      if (aVal === null) aVal = sortField === 'stock_quantity' ? Infinity : '';
      if (bVal === null) bVal = sortField === 'stock_quantity' ? Infinity : '';
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [rewards, searchTerm, categoryFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const handleOpenModal = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        title: reward.title,
        description: reward.description,
        category: reward.category,
        cost: reward.cost,
        stock_quantity: reward.stock_quantity,
        is_active: reward.is_active,
        image_url: reward.image_url,
        is_featured: reward.is_featured,
        token_gated: reward.token_gated || false,
        token_contract_address: reward.token_contract_address,
        minimum_token_balance: reward.minimum_token_balance || 1,
        token_name: reward.token_name,
        token_symbol: reward.token_symbol,
        brand_id: reward.brand_id || null,
      });
      setImagePreview(reward.image_url);
    } else {
      setEditingReward(null);
      setFormData({
        title: '',
        description: '',
        category: 'alliance_tokens',
        cost: 0,
        stock_quantity: null,
        is_active: true,
        image_url: null,
        is_featured: false,
        token_gated: false,
        token_contract_address: null,
        minimum_token_balance: 1,
        token_name: null,
        token_symbol: null,
        brand_id: null,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleDuplicate = (reward: Reward) => {
    setEditingReward(null);
    setFormData({
      title: `${reward.title} (Copy)`,
      description: reward.description,
      category: reward.category,
      cost: reward.cost,
      stock_quantity: reward.stock_quantity,
      is_active: false, // Start as inactive
      image_url: reward.image_url,
      is_featured: false,
      token_gated: reward.token_gated || false,
      token_contract_address: reward.token_contract_address,
      minimum_token_balance: reward.minimum_token_balance || 1,
      token_name: reward.token_name,
      token_symbol: reward.token_symbol,
      brand_id: reward.brand_id || null,
    });
    setImagePreview(reward.image_url);
    setImageFile(null);
    setShowModal(true);
  };

  // Quick toggle handlers
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setRewards(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
      toast({ 
        title: !currentStatus ? 'Activated' : 'Deactivated',
        description: `Reward ${!currentStatus ? 'is now visible' : 'hidden from'} marketplace`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update reward status',
        variant: 'destructive',
      });
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setRewards(prev => prev.map(r => r.id === id ? { ...r, is_featured: !currentStatus } : r));
      toast({ 
        title: !currentStatus ? 'Featured' : 'Unfeatured',
        description: `Reward ${!currentStatus ? 'added to' : 'removed from'} featured carousel`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update featured status',
        variant: 'destructive',
      });
    }
  };

  // Stock adjustment
  const adjustStock = async (id: string, delta: number) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward || reward.stock_quantity === null) return;
    
    const newStock = Math.max(0, reward.stock_quantity + delta);
    
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ stock_quantity: newStock })
        .eq('id', id);

      if (error) throw error;
      
      setRewards(prev => prev.map(r => r.id === id ? { ...r, stock_quantity: newStock } : r));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update stock',
        variant: 'destructive',
      });
    }
  };

  const setExactStock = async (id: string, quantity: number | null) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ stock_quantity: quantity })
        .eq('id', id);

      if (error) throw error;
      
      setRewards(prev => prev.map(r => r.id === id ? { ...r, stock_quantity: quantity } : r));
      toast({ title: 'Stock Updated' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update stock',
        variant: 'destructive',
      });
    }
  };

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRewards.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const bulkAction = async (action: 'activate' | 'deactivate' | 'feature' | 'unfeature') => {
    if (selectedIds.size === 0) return;
    
    const updates: Record<string, boolean> = {};
    if (action === 'activate') updates.is_active = true;
    if (action === 'deactivate') updates.is_active = false;
    if (action === 'feature') updates.is_featured = true;
    if (action === 'unfeature') updates.is_featured = false;
    
    try {
      const { error } = await supabase
        .from('rewards')
        .update(updates)
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      toast({ title: 'Success', description: `Updated ${selectedIds.size} rewards` });
      setSelectedIds(new Set());
      loadRewards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update rewards',
        variant: 'destructive',
      });
    }
  };

  // Gift to user
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setGiftUsers([]);
      return;
    }
    
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);
    
    setGiftUsers(data || []);
  };

  const handleGiftReward = async () => {
    if (!giftReward || !selectedGiftUser) return;
    
    setGiftingInProgress(true);
    try {
      const { data, error } = await supabase.rpc('admin_gift_reward', {
        p_user_id: selectedGiftUser.id,
        p_reward_id: giftReward.id,
        p_admin_notes: `Gifted by admin`
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Failed to gift reward');

      toast({
        title: 'Reward Gifted', 
        description: `${giftReward.title} gifted to ${selectedGiftUser.email}` 
      });
      setShowGiftModal(false);
      setGiftReward(null);
      setSelectedGiftUser(null);
      setGiftUserSearch('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to gift reward',
        variant: 'destructive',
      });
    } finally {
      setGiftingInProgress(false);
    }
  };

  // Delete reward
  const confirmDelete = async (reward: Reward) => {
    // Check claim count
    const { count } = await supabase
      .from('rewards_claims')
      .select('*', { count: 'exact', head: true })
      .eq('reward_id', reward.id);
    
    setDeleteReward(reward);
    setDeleteClaimCount(count || 0);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteReward) return;

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', deleteReward.id);

      if (error) throw error;

      // Delete image from storage if exists
      if (deleteReward.image_url) {
        const imagePath = deleteReward.image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage.from('reward-images').remove([`rewards/${imagePath}`]);
        }
      }

      toast({ title: 'Success', description: 'Reward deleted successfully' });
      setShowDeleteModal(false);
      setDeleteReward(null);
      loadRewards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete reward',
        variant: 'destructive',
      });
    }
  };

  // Image handling
  const validateAndSetImage = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: 'Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetImage(file);
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetImage(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: null });
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url;
    try {
      setUploading(true);
      const { file: compressedFile, originalSize, compressedSize, compressionRatio } = 
        await compressImageWithStats(imageFile);
      if (compressionRatio > 0.1) {
        toast({ title: 'Image Compressed', description: `Reduced from ${formatBytes(originalSize)} to ${formatBytes(compressedSize)}` });
      }
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `rewards/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('reward-images')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('reward-images').getPublicUrl(filePath);
      return publicUrl;
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload image', variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const imageUrl = await uploadImage();
      if (imageFile && !imageUrl) return;
      const dataToSave = { ...formData, image_url: imageUrl };
      if (editingReward) {
        const { error } = await supabase.from('rewards').update(dataToSave).eq('id', editingReward.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Reward updated successfully' });
      } else {
        const { error } = await supabase.from('rewards').insert([dataToSave]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Reward created successfully' });
      }
      setShowModal(false);
      setImageFile(null);
      setImagePreview(null);
      loadRewards();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save reward', variant: 'destructive' });
    }
  };

  const getStockRowClass = (stock: number | null) => {
    if (stock === null) return '';
    if (stock === 0) return 'bg-red-500/10';
    if (stock < 5) return 'bg-amber-500/10';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Rewards Management</h2>
          <p className="text-muted-foreground mt-1">Create and manage rewards</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Add Reward
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-primary/5 border rounded-lg">
          <span className="font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkAction('activate')}>Activate</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction('deactivate')}>Deactivate</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction('feature')}>Feature</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction('unfeature')}>Unfeature</Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear Selection</Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.size === filteredRewards.length && filteredRewards.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-14">Image</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                  Title <SortIcon field="title" />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('cost')}>
                  Cost <SortIcon field="cost" />
                </TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => handleSort('stock_quantity')}>
                  Stock <SortIcon field="stock_quantity" />
                </TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => handleSort('claim_count')}>
                  <ShoppingCart className="w-4 h-4 inline mr-1" />
                  Claims <SortIcon field="claim_count" />
                </TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => handleSort('wishlist_count')}>
                  <Heart className="w-4 h-4 inline mr-1" />
                  Wishlist <SortIcon field="wishlist_count" />
                </TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRewards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">No rewards found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or create a new reward</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRewards.map((reward) => (
                  <TableRow key={reward.id} className={getStockRowClass(reward.stock_quantity)}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(reward.id)}
                        onCheckedChange={(checked) => handleSelectOne(reward.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      {reward.image_url ? (
                        <img 
                          src={reward.image_url} 
                          alt={reward.title}
                          className="w-10 h-10 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-lg border flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{reward.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{reward.category.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{reward.cost}</TableCell>
                    <TableCell className="text-center">
                      {reward.stock_quantity === null ? (
                        <Badge variant="secondary">Unlimited</Badge>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => adjustStock(reward.id, -1)}
                            disabled={reward.stock_quantity === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className={cn(
                                "h-6 min-w-8 px-2",
                                reward.stock_quantity === 0 && "text-red-600 font-bold",
                                reward.stock_quantity !== null && reward.stock_quantity < 5 && reward.stock_quantity > 0 && "text-amber-600 font-medium"
                              )}>
                                {reward.stock_quantity}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-3">
                              <div className="space-y-2">
                                <Label>Set Stock Quantity</Label>
                                <div className="flex gap-2">
                                  <Input 
                                    type="number" 
                                    defaultValue={reward.stock_quantity ?? ''} 
                                    placeholder="Unlimited"
                                    id={`stock-${reward.id}`}
                                  />
                                  <Button size="sm" onClick={() => {
                                    const input = document.getElementById(`stock-${reward.id}`) as HTMLInputElement;
                                    const val = input.value ? parseInt(input.value) : null;
                                    setExactStock(reward.id, val);
                                  }}>Set</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => adjustStock(reward.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={reward.claim_count > 0 ? "default" : "secondary"}>
                        {reward.claim_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={reward.wishlist_count > 0 ? "default" : "secondary"}>
                        {reward.wishlist_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={reward.is_featured}
                          onCheckedChange={() => toggleFeatured(reward.id, reward.is_featured)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={reward.is_active}
                          onCheckedChange={() => toggleActive(reward.id, reward.is_active)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenModal(reward)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(reward)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/rewards/${reward.id}`, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View in Marketplace
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setGiftReward(reward);
                            setShowGiftModal(true);
                          }}>
                            <Gift className="w-4 h-4 mr-2" />
                            Gift to User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleActive(reward.id, reward.is_active)}>
                            {reward.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => confirmDelete(reward)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Reward Image</Label>
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={handleRemoveImage}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
                    isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                  <Input id="image-upload" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cost (claims)</Label>
                <Input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stock Quantity (empty for unlimited)</Label>
              <Input type="number" value={formData.stock_quantity ?? ''} placeholder="Unlimited" onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value ? parseInt(e.target.value) : null })} />
            </div>

            <div className="space-y-2">
              <Label>Brand (optional)</Label>
              <Select value={formData.brand_id || 'none'} onValueChange={(v) => setFormData({ ...formData, brand_id: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="No specific brand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific brand</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
                <Label htmlFor="featured" className="flex items-center gap-1">
                  <Star className="w-4 h-4" /> Featured
                </Label>
              </div>
            </div>

            {/* Token Gating */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Token Gating
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Require tokens to claim</p>
                </div>
                <Switch checked={formData.token_gated} onCheckedChange={(checked) => setFormData({ ...formData, token_gated: checked })} />
              </div>
              {formData.token_gated && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Token Name</Label>
                      <Input value={formData.token_name || ''} onChange={(e) => setFormData({ ...formData, token_name: e.target.value })} placeholder="USDC" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Symbol</Label>
                      <Input value={formData.token_symbol || ''} onChange={(e) => setFormData({ ...formData, token_symbol: e.target.value })} placeholder="USDC" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contract Address</Label>
                    <Input value={formData.token_contract_address || ''} onChange={(e) => setFormData({ ...formData, token_contract_address: e.target.value })} placeholder="0x..." className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min Balance</Label>
                    <Input type="number" value={formData.minimum_token_balance} onChange={(e) => setFormData({ ...formData, minimum_token_balance: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={uploading}>{uploading ? 'Uploading...' : editingReward ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Modal */}
      <Dialog open={showGiftModal} onOpenChange={setShowGiftModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" /> Gift Reward
            </DialogTitle>
            <DialogDescription>Gift "{giftReward?.title}" to a user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <Input 
                placeholder="Search by email or name..." 
                value={giftUserSearch}
                onChange={(e) => {
                  setGiftUserSearch(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>
            {giftUsers.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {giftUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedGiftUser(user)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted transition-colors",
                      selectedGiftUser?.id === user.id && "bg-primary/10"
                    )}
                  >
                    <div className="font-medium">{user.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedGiftUser && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm">
                  Gift to: <strong>{selectedGiftUser.full_name || selectedGiftUser.email}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This will add {giftReward?.cost} claims to their balance
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowGiftModal(false); setSelectedGiftUser(null); setGiftUserSearch(''); }}>Cancel</Button>
            <Button onClick={handleGiftReward} disabled={!selectedGiftUser || giftingInProgress}>
              {giftingInProgress ? 'Gifting...' : 'Gift Reward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Delete Reward
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {deleteClaimCount > 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="font-medium text-amber-600">Warning: This reward has been claimed {deleteClaimCount} time(s)</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Deleting this reward may affect users who have claimed it. Consider deactivating instead.
                </p>
              </div>
            ) : (
              <p>Are you sure you want to delete "{deleteReward?.title}"? This action cannot be undone.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
