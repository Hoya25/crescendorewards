import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
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
import { SponsorshipEditor } from '@/components/admin/SponsorshipEditor';
import { getSponsorshipStatus, formatSponsorshipStatus, type SponsorshipData } from '@/lib/sponsorship-utils';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useAdminRole } from '@/hooks/useAdminRole';
import { 
  Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Lock, 
  MoreHorizontal, Copy, ExternalLink, Gift, ChevronUp, ChevronDown,
  Minus, Search, Star, AlertTriangle, Heart, ShoppingCart, Package, Megaphone, Truck,
  Shield, GripVertical, Save, RotateCcw, Loader2, ArrowUp, ArrowDown, DollarSign
} from 'lucide-react';
import { validateImageFile } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { cn } from '@/lib/utils';
import type { DeliveryMethod, RequiredDataField } from '@/types/delivery';
import { DELIVERY_METHOD_LABELS, DELIVERY_METHOD_REQUIRED_FIELDS } from '@/types/delivery';

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
  display_order: number;
  // Sponsorship fields
  sponsor_enabled: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  sponsor_link: string | null;
  sponsor_start_date: string | null;
  sponsor_end_date: string | null;
  // Delivery fields
  delivery_method: DeliveryMethod | null;
  required_user_data: RequiredDataField[] | null;
  delivery_instructions: string | null;
  // Status tier restriction
  min_status_tier: string | null;
  status_tier_claims_cost: Record<string, number> | null;
}

interface Brand {
  id: string;
  name: string;
}

type SortField = 'title' | 'cost' | 'stock_quantity' | 'claim_count' | 'wishlist_count' | 'created_at';
type SortDirection = 'asc' | 'desc';

// Status tier options for reward eligibility
const STATUS_TIER_OPTIONS = [
  { value: 'none', label: 'All Members', description: 'Anyone can claim' },
  { value: 'bronze', label: 'Bronze & Above', description: 'Bronze, Silver, Gold, Platinum, Diamond' },
  { value: 'silver', label: 'Silver & Above', description: 'Silver, Gold, Platinum, Diamond' },
  { value: 'gold', label: 'Gold & Above', description: 'Gold, Platinum, Diamond' },
  { value: 'platinum', label: 'Platinum & Above', description: 'Platinum, Diamond' },
  { value: 'diamond', label: 'Diamond Only', description: 'Diamond tier exclusive' },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'alliance_tokens', label: 'Alliance Tokens' },
  { value: 'experiences', label: 'Experiences' },
  { value: 'merch', label: 'Merchandise' },
  { value: 'gift_cards', label: 'Gift Cards' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'opportunity', label: 'Opportunity' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'featured', label: 'Featured' },
  { value: 'sponsored', label: 'Sponsored' },
  { value: 'low_stock', label: 'Low Stock (<5)' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const STATUS_ACCESS_FILTERS = [
  { value: 'all', label: 'All Access' },
  { value: 'unrestricted', label: '🔓 Unrestricted' },
  { value: 'bronze', label: '🥉 Bronze+' },
  { value: 'silver', label: '🥈 Silver+' },
  { value: 'gold', label: '🥇 Gold+' },
  { value: 'platinum', label: '💎 Platinum+' },
  { value: 'diamond', label: '👑 Diamond Only' },
  { value: 'tiered-pricing', label: '💲 Has Tier Pricing' },
];

const TIER_BADGES: Record<string, { emoji: string; label: string; className: string }> = {
  all: { emoji: '🔓', label: 'All', className: 'bg-green-500/10 text-green-600 border-green-200' },
  bronze: { emoji: '🥉', label: 'Bronze+', className: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  silver: { emoji: '🥈', label: 'Silver+', className: 'bg-slate-400/10 text-slate-600 border-slate-300' },
  gold: { emoji: '🥇', label: 'Gold+', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  platinum: { emoji: '💎', label: 'Platinum+', className: 'bg-slate-500/10 text-slate-700 border-slate-300' },
  diamond: { emoji: '👑', label: 'Diamond', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-200' },
};

export function AdminRewards() {
  const { hasPermission, logActivity } = useAdminRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const MAX_IMAGES = 4;
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusAccessFilter, setStatusAccessFilter] = useState('all');
  
  // Sorting & Ordering
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [orderMode, setOrderMode] = useState(false);
  const [originalRewards, setOriginalRewards] = useState<Reward[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Gift modal
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftReward, setGiftReward] = useState<Reward | null>(null);
  const [giftUserSearch, setGiftUserSearch] = useState('');
  const [giftUsers, setGiftUsers] = useState<any[]>([]);
  const [selectedGiftUser, setSelectedGiftUser] = useState<any>(null);
  const [giftingInProgress, setGiftingInProgress] = useState(false);
  
  // Bulk sponsorship modal
  const [showBulkSponsorModal, setShowBulkSponsorModal] = useState(false);
  const [bulkSponsorData, setBulkSponsorData] = useState({
    sponsor_name: '',
    sponsor_logo: '',
    sponsor_link: '',
    sponsor_start_date: '',
    sponsor_end_date: '',
  });
  const [bulkSponsorSaving, setBulkSponsorSaving] = useState(false);
  
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
    // Sponsorship fields
    sponsor_enabled: false,
    sponsor_name: null as string | null,
    sponsor_logo: null as string | null,
    sponsor_link: null as string | null,
    sponsor_start_date: null as string | null,
    sponsor_end_date: null as string | null,
    // Delivery fields
    delivery_method: 'email' as DeliveryMethod,
    required_user_data: ['email'] as RequiredDataField[],
    delivery_instructions: null as string | null,
    // Status tier restriction
    min_status_tier: null as string | null,
  });

  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    loadRewards();
    loadBrands();
  }, []);

  // Handle edit query param for quick edit from reward detail page
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && rewards.length > 0 && !loading) {
      const rewardToEdit = rewards.find(r => r.id === editId);
      if (rewardToEdit) {
        // Inline the edit logic to avoid calling handleOpenModal before it's defined
        setEditingReward(rewardToEdit);
          setFormData({
          title: rewardToEdit.title,
          description: rewardToEdit.description,
          category: rewardToEdit.category,
          cost: rewardToEdit.cost,
          stock_quantity: rewardToEdit.stock_quantity,
          is_active: rewardToEdit.is_active,
          image_url: rewardToEdit.image_url,
          is_featured: rewardToEdit.is_featured,
          token_gated: rewardToEdit.token_gated || false,
          token_contract_address: rewardToEdit.token_contract_address,
          minimum_token_balance: rewardToEdit.minimum_token_balance || 1,
          token_name: rewardToEdit.token_name,
          token_symbol: rewardToEdit.token_symbol,
          brand_id: rewardToEdit.brand_id || null,
          sponsor_enabled: rewardToEdit.sponsor_enabled || false,
          sponsor_name: rewardToEdit.sponsor_name,
          sponsor_logo: rewardToEdit.sponsor_logo,
          sponsor_link: rewardToEdit.sponsor_link,
          sponsor_start_date: rewardToEdit.sponsor_start_date,
          sponsor_end_date: rewardToEdit.sponsor_end_date,
          delivery_method: (rewardToEdit.delivery_method as DeliveryMethod) || 'email',
          required_user_data: rewardToEdit.required_user_data || ['email'],
          delivery_instructions: rewardToEdit.delivery_instructions,
          min_status_tier: rewardToEdit.min_status_tier || null,
        });
        // Set existing images from image_url (primary image)
        const existingImgUrls = rewardToEdit.image_url ? [rewardToEdit.image_url] : [];
        setExistingImages(existingImgUrls);
        setImagePreviews(existingImgUrls);
        setSelectedImages([]);
        setShowModal(true);
        // Clear the edit param from URL
        searchParams.delete('edit');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [rewards, searchParams, loading]);

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
      
      // Fetch rewards with display_order
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false });

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

      // Merge data with display_order fallback
      const enrichedRewards = (rewardsData || []).map((reward, idx) => ({
        ...reward,
        display_order: reward.display_order ?? idx + 1,
        status_tier_claims_cost: reward.status_tier_claims_cost as Record<string, number> | null,
        delivery_method: (reward.delivery_method || 'email') as DeliveryMethod,
        required_user_data: reward.required_user_data as RequiredDataField[] | null,
        claim_count: claimCounts[reward.id] || 0,
        wishlist_count: wishlistCounts[reward.id] || 0,
      }));

      setRewards(enrichedRewards as Reward[]);
      setOriginalRewards(JSON.parse(JSON.stringify(enrichedRewards)));
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

  // Helper to check if reward has tier pricing
  const hasTierPricing = (reward: Reward): boolean => {
    if (!reward.status_tier_claims_cost) return false;
    const costs = reward.status_tier_claims_cost;
    const values = Object.values(costs).filter(v => typeof v === 'number');
    if (values.length === 0) return false;
    return values.some(v => v !== reward.cost && v !== null);
  };

  // Check for unsaved order changes
  const hasOrderChanges = useMemo(() => {
    if (!orderMode) return false;
    return rewards.some(reward => {
      const original = originalRewards.find(r => r.id === reward.id);
      return !original || reward.display_order !== original.display_order;
    });
  }, [rewards, originalRewards, orderMode]);

  // Drag handlers for row ordering
  const handleRowDragStart = (e: React.DragEvent, id: string) => {
    if (!orderMode) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleRowDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (orderMode && draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleRowDragLeave = () => {
    setDragOverId(null);
  };

  const handleRowDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);

    if (!orderMode || !draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setRewards(prev => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const draggedIdx = sorted.findIndex(r => r.id === draggedId);
      const targetIdx = sorted.findIndex(r => r.id === targetId);

      if (draggedIdx === -1 || targetIdx === -1) return prev;

      const [dragged] = sorted.splice(draggedIdx, 1);
      sorted.splice(targetIdx, 0, dragged);

      return sorted.map((r, i) => ({ ...r, display_order: i + 1 }));
    });

    setDraggedId(null);
  };

  const handleRowDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Move selected to top/bottom
  const moveSelectedToPosition = (position: 'top' | 'bottom') => {
    if (selectedIds.size === 0) return;

    setRewards(prev => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const selected = sorted.filter(r => selectedIds.has(r.id));
      const unselected = sorted.filter(r => !selectedIds.has(r.id));

      const reordered = position === 'top' 
        ? [...selected, ...unselected] 
        : [...unselected, ...selected];

      return reordered.map((r, i) => ({ ...r, display_order: i + 1 }));
    });
    setSelectedIds(new Set());
  };

  // Save order changes
  const saveOrderChanges = async () => {
    setSavingOrder(true);
    try {
      const updates = rewards.filter(r => {
        const original = originalRewards.find(o => o.id === r.id);
        return !original || r.display_order !== original.display_order;
      });

      for (const reward of updates) {
        const { error } = await supabase
          .from('rewards')
          .update({ display_order: reward.display_order })
          .eq('id', reward.id);

        if (error) throw error;
      }

      setOriginalRewards(JSON.parse(JSON.stringify(rewards)));
      toast({ title: 'Order Saved', description: `Updated ${updates.length} reward positions` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save order',
        variant: 'destructive',
      });
    } finally {
      setSavingOrder(false);
    }
  };

  // Discard order changes
  const discardOrderChanges = () => {
    setRewards(JSON.parse(JSON.stringify(originalRewards)));
    setSelectedIds(new Set());
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
      
      // Status access filter
      if (statusAccessFilter !== 'all') {
        if (statusAccessFilter === 'unrestricted' && reward.min_status_tier) return false;
        if (statusAccessFilter === 'tiered-pricing' && !hasTierPricing(reward)) return false;
        if (['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(statusAccessFilter) && 
            reward.min_status_tier !== statusAccessFilter) return false;
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
        case 'sponsored':
          const sponsorStatus = getSponsorshipStatus({
            sponsor_enabled: reward.sponsor_enabled,
            sponsor_name: reward.sponsor_name,
            sponsor_logo: reward.sponsor_logo,
            sponsor_link: reward.sponsor_link,
            sponsor_start_date: reward.sponsor_start_date,
            sponsor_end_date: reward.sponsor_end_date,
          });
          if (sponsorStatus === 'none') return false;
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

    // Sort by display_order when in order mode, otherwise by selected sort
    if (orderMode) {
      filtered.sort((a, b) => a.display_order - b.display_order);
    } else {
      filtered.sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];
        if (aVal === null) aVal = sortField === 'stock_quantity' ? Infinity : '';
        if (bVal === null) bVal = sortField === 'stock_quantity' ? Infinity : '';
        if (typeof aVal === 'string') {
          return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [rewards, searchTerm, categoryFilter, statusFilter, statusAccessFilter, sortField, sortDirection, orderMode]);

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
        sponsor_enabled: reward.sponsor_enabled || false,
        sponsor_name: reward.sponsor_name,
        sponsor_logo: reward.sponsor_logo,
        sponsor_link: reward.sponsor_link,
        sponsor_start_date: reward.sponsor_start_date,
        sponsor_end_date: reward.sponsor_end_date,
        delivery_method: (reward.delivery_method as DeliveryMethod) || 'email',
        required_user_data: reward.required_user_data || ['email'],
        delivery_instructions: reward.delivery_instructions,
        min_status_tier: reward.min_status_tier || null,
      });
      const existingImgUrls = reward.image_url ? [reward.image_url] : [];
      setExistingImages(existingImgUrls);
      setImagePreviews(existingImgUrls);
      setSelectedImages([]);
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
        sponsor_enabled: false,
        sponsor_name: null,
        sponsor_logo: null,
        sponsor_link: null,
        sponsor_start_date: null,
        sponsor_end_date: null,
        delivery_method: 'email',
        required_user_data: ['email'],
        delivery_instructions: null,
        min_status_tier: null,
      });
      setExistingImages([]);
      setImagePreviews([]);
      setSelectedImages([]);
    }
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
      sponsor_enabled: false, // Don't duplicate sponsorship
      sponsor_name: null,
      sponsor_logo: null,
      sponsor_link: null,
      sponsor_start_date: null,
      sponsor_end_date: null,
      delivery_method: (reward.delivery_method as DeliveryMethod) || 'email',
      required_user_data: reward.required_user_data || ['email'],
      delivery_instructions: reward.delivery_instructions,
      min_status_tier: reward.min_status_tier || null, // Keep tier restriction on duplicate
    });
    const existingImgUrls = reward.image_url ? [reward.image_url] : [];
    setExistingImages(existingImgUrls);
    setImagePreviews(existingImgUrls);
    setSelectedImages([]);
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

  const toggleSponsorship = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ sponsor_enabled: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setRewards(prev => prev.map(r => r.id === id ? { ...r, sponsor_enabled: !currentStatus } : r));
      toast({ 
        title: !currentStatus ? 'Sponsorship Enabled' : 'Sponsorship Disabled',
        description: `Sponsorship ${!currentStatus ? 'is now visible' : 'hidden from'} users`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update sponsorship status',
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

  // Bulk sponsorship
  const handleBulkSponsor = async () => {
    if (selectedIds.size === 0) return;
    
    // Validate required fields
    if (!bulkSponsorData.sponsor_name || !bulkSponsorData.sponsor_logo || 
        !bulkSponsorData.sponsor_start_date || !bulkSponsorData.sponsor_end_date) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate dates
    if (new Date(bulkSponsorData.sponsor_end_date) < new Date(bulkSponsorData.sponsor_start_date)) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    setBulkSponsorSaving(true);
    try {
      const { error } = await supabase
        .from('rewards')
        .update({
          sponsor_enabled: true,
          sponsor_name: bulkSponsorData.sponsor_name,
          sponsor_logo: bulkSponsorData.sponsor_logo,
          sponsor_link: bulkSponsorData.sponsor_link || null,
          sponsor_start_date: bulkSponsorData.sponsor_start_date,
          sponsor_end_date: bulkSponsorData.sponsor_end_date,
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      toast({ 
        title: 'Sponsorship Applied', 
        description: `Added "${bulkSponsorData.sponsor_name}" sponsorship to ${selectedIds.size} rewards` 
      });
      setSelectedIds(new Set());
      setShowBulkSponsorModal(false);
      setBulkSponsorData({
        sponsor_name: '',
        sponsor_logo: '',
        sponsor_link: '',
        sponsor_start_date: '',
        sponsor_end_date: '',
      });
      loadRewards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply sponsorship',
        variant: 'destructive',
      });
    } finally {
      setBulkSponsorSaving(false);
    }
  };

  const handleRemoveBulkSponsorship = async () => {
    if (selectedIds.size === 0) return;

    try {
      const { error } = await supabase
        .from('rewards')
        .update({
          sponsor_enabled: false,
          sponsor_name: null,
          sponsor_logo: null,
          sponsor_link: null,
          sponsor_start_date: null,
          sponsor_end_date: null,
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      toast({ 
        title: 'Sponsorship Removed', 
        description: `Removed sponsorship from ${selectedIds.size} rewards` 
      });
      setSelectedIds(new Set());
      loadRewards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove sponsorship',
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

  // Image handling - multiple images support
  const validateAndAddImage = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: 'Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }
    
    const totalImages = existingImages.length + selectedImages.length;
    if (totalImages >= MAX_IMAGES) {
      toast({
        title: 'Maximum images reached',
        description: `You can only upload up to ${MAX_IMAGES} images`,
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedImages(prev => [...prev, file]);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_IMAGES - (existingImages.length + selectedImages.length);
    const filesToAdd = files.slice(0, remainingSlots);
    
    filesToAdd.forEach(file => validateAndAddImage(file));
    e.target.value = ''; // Reset input
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    const remainingSlots = MAX_IMAGES - (existingImages.length + selectedImages.length);
    const filesToAdd = files.slice(0, remainingSlots);
    
    filesToAdd.forEach(file => validateAndAddImage(file));
  };

  const handleRemoveImage = (index: number) => {
    // Check if it's an existing image or a new one
    if (index < existingImages.length) {
      // Remove from existing images
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new selected images
      const newImageIndex = index - existingImages.length;
      setSelectedImages(prev => prev.filter((_, i) => i !== newImageIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [...existingImages];
    
    if (selectedImages.length === 0) return uploadedUrls;
    
    try {
      setUploading(true);
      
      for (const imageFile of selectedImages) {
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
        uploadedUrls.push(publicUrl);
      }
      
      return uploadedUrls;
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload image', variant: 'destructive' });
      return existingImages; // Return existing on failure
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const imageUrls = await uploadImages();
      // Use first image as primary image_url for backwards compatibility
      const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
      const dataToSave = { ...formData, image_url: primaryImageUrl };
      
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
      setSelectedImages([]);
      setImagePreviews([]);
      setExistingImages([]);
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
        <PermissionGate permission="rewards_create">
          <Button onClick={() => handleOpenModal()} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Add Reward
          </Button>
        </PermissionGate>
      </div>

      {/* Filters & Order Mode Toggle */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
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
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusAccessFilter} onValueChange={setStatusAccessFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status Access" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ACCESS_FILTERS.map(access => (
                  <SelectItem key={access.value} value={access.value}>{access.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Order Mode Toggle */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <Switch 
                id="order-mode"
                checked={orderMode}
                onCheckedChange={setOrderMode}
              />
              <label htmlFor="order-mode" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <GripVertical className="w-4 h-4" />
                Reorder Mode
              </label>
              {orderMode && (
                <Badge variant="outline" className="text-xs">Drag rows to reorder</Badge>
              )}
            </div>
            
            {hasOrderChanges && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Unsaved Changes
                </Badge>
                <Button variant="outline" size="sm" onClick={discardOrderChanges}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Discard
                </Button>
                <Button size="sm" onClick={saveOrderChanges} disabled={savingOrder}>
                  {savingOrder ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save Order
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-primary/5 border rounded-lg">
          <span className="font-medium">{selectedIds.size} selected</span>
          <div className="flex flex-wrap gap-2">
            {orderMode && (
              <>
                <Button size="sm" variant="outline" onClick={() => moveSelectedToPosition('top')} className="gap-1">
                  <ArrowUp className="w-3 h-3" />
                  Move to Top
                </Button>
                <Button size="sm" variant="outline" onClick={() => moveSelectedToPosition('bottom')} className="gap-1">
                  <ArrowDown className="w-3 h-3" />
                  Move to Bottom
                </Button>
                <div className="h-6 w-px bg-border mx-1" />
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => bulkAction('activate')}>Activate</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction('deactivate')}>Deactivate</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction('feature')}>Feature</Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction('unfeature')}>Unfeature</Button>
            <div className="h-6 w-px bg-border mx-1" />
            <Button size="sm" variant="outline" onClick={() => setShowBulkSponsorModal(true)} className="gap-1">
              <Megaphone className="w-3 h-3" />
              Add Sponsor
            </Button>
            <Button size="sm" variant="outline" onClick={handleRemoveBulkSponsorship}>
              Remove Sponsor
            </Button>
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
                {orderMode && <TableHead className="w-10"></TableHead>}
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
                <TableHead className="text-center">Sponsor</TableHead>
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
                  <TableCell colSpan={12} className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">No rewards found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or create a new reward</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRewards.map((reward) => (
                  <TableRow 
                    key={reward.id} 
                    className={cn(
                      getStockRowClass(reward.stock_quantity),
                      orderMode && draggedId === reward.id && 'opacity-50',
                      orderMode && dragOverId === reward.id && 'border-t-2 border-primary'
                    )}
                    draggable={orderMode}
                    onDragStart={(e) => handleRowDragStart(e, reward.id)}
                    onDragOver={(e) => handleRowDragOver(e, reward.id)}
                    onDragLeave={handleRowDragLeave}
                    onDrop={(e) => handleRowDrop(e, reward.id)}
                  >
                    {orderMode && (
                      <TableCell className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    )}
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
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={reward.sponsor_enabled}
                          onCheckedChange={() => toggleSponsorship(reward.id, reward.sponsor_enabled)}
                          disabled={!reward.sponsor_name}
                        />
                        {reward.sponsor_enabled && reward.sponsor_name && (
                          (() => {
                            const sponsorStatus = getSponsorshipStatus({
                              sponsor_enabled: reward.sponsor_enabled,
                              sponsor_name: reward.sponsor_name,
                              sponsor_logo: reward.sponsor_logo,
                              sponsor_link: reward.sponsor_link,
                              sponsor_start_date: reward.sponsor_start_date,
                              sponsor_end_date: reward.sponsor_end_date,
                            });
                            const display = formatSponsorshipStatus(sponsorStatus);
                            return (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Badge 
                                    variant={display.variant} 
                                    className={cn("text-xs cursor-pointer", display.className)}
                                  >
                                    <Megaphone className="w-3 h-3 mr-1" />
                                    {reward.sponsor_name.substring(0, 8)}
                                    {reward.sponsor_name.length > 8 && '...'}
                                  </Badge>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {reward.sponsor_logo && (
                                        <img 
                                          src={reward.sponsor_logo} 
                                          alt={reward.sponsor_name} 
                                          className="h-6 w-auto object-contain"
                                        />
                                      )}
                                      <span className="font-medium">{reward.sponsor_name}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      <div>Status: <Badge variant={display.variant} className={cn("text-xs ml-1", display.className)}>{display.label}</Badge></div>
                                      {reward.sponsor_start_date && (
                                        <div>Start: {new Date(reward.sponsor_start_date).toLocaleDateString()}</div>
                                      )}
                                      {reward.sponsor_end_date && (
                                        <div>End: {new Date(reward.sponsor_end_date).toLocaleDateString()}</div>
                                      )}
                                      {reward.sponsor_link && (
                                        <div className="truncate">Link: {reward.sponsor_link}</div>
                                      )}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          })()
                        )}
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
                          <PermissionGate permission="rewards_edit">
                            <DropdownMenuItem onClick={() => handleOpenModal(reward)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="rewards_create">
                            <DropdownMenuItem onClick={() => handleDuplicate(reward)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                          </PermissionGate>
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
                          <PermissionGate permission="rewards_edit">
                            <DropdownMenuItem onClick={() => toggleActive(reward.id, reward.is_active)}>
                              {reward.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="rewards_delete">
                            <DropdownMenuItem 
                              onClick={() => confirmDelete(reward)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </PermissionGate>
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
            {/* Multi-Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Reward Images</span>
                <span className="text-xs text-muted-foreground">{imagePreviews.length}/{MAX_IMAGES} images</span>
              </Label>
              
              {/* Image previews grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1">
                        <Badge variant="secondary" className="text-xs">
                          {index === 0 ? 'Primary' : `#${index + 1}`}
                        </Badge>
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload area - show only if we have room for more */}
              {imagePreviews.length < MAX_IMAGES && (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
                    isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {imagePreviews.length === 0 ? 'Drag & drop or click to upload' : 'Add more images'}
                  </p>
                  <p className="text-xs text-muted-foreground/70">PNG/JPG • Max 5MB each • Up to {MAX_IMAGES} images</p>
                  <Input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleImageSelect} 
                    className="hidden" 
                  />
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

            {/* Status Tier Eligibility */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Minimum Status Level
              </Label>
              <p className="text-xs text-muted-foreground">Restrict who can claim based on Crescendo Status</p>
              <Select 
                value={formData.min_status_tier || 'none'} 
                onValueChange={(v) => setFormData({ ...formData, min_status_tier: v === 'none' ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="All Members" /></SelectTrigger>
                <SelectContent>
                  {STATUS_TIER_OPTIONS.map(tier => (
                    <SelectItem key={tier.value} value={tier.value}>
                      <div className="flex flex-col">
                        <span>{tier.label}</span>
                        <span className="text-xs text-muted-foreground">{tier.description}</span>
                      </div>
                    </SelectItem>
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

            {/* Sponsorship */}
            <SponsorshipEditor
              formData={{
                sponsor_enabled: formData.sponsor_enabled,
                sponsor_name: formData.sponsor_name,
                sponsor_logo: formData.sponsor_logo,
                sponsor_link: formData.sponsor_link,
                sponsor_start_date: formData.sponsor_start_date,
                sponsor_end_date: formData.sponsor_end_date,
              }}
              onChange={(updates) => setFormData({ ...formData, ...updates })}
            />

            {/* Delivery Configuration */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <Label className="text-base font-semibold">Delivery Configuration</Label>
              </div>
              
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                {/* Delivery Method */}
                <div className="space-y-2">
                  <Label className="text-sm">Delivery Method</Label>
                  <Select 
                    value={formData.delivery_method} 
                    onValueChange={(v) => {
                      const method = v as DeliveryMethod;
                      // Auto-populate required fields based on method
                      const defaultFields = DELIVERY_METHOD_REQUIRED_FIELDS[method] || ['email'];
                      setFormData({ 
                        ...formData, 
                        delivery_method: method,
                        required_user_data: defaultFields
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DELIVERY_METHOD_LABELS).map(([value, { label, description }]) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground ml-2">- {description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Required User Data */}
                <div className="space-y-2">
                  <Label className="text-sm">Required User Data</Label>
                  <p className="text-xs text-muted-foreground">Select what info is needed from users to claim this reward</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {([
                      { field: 'email', label: 'Email Address' },
                      { field: 'phone', label: 'Phone Number' },
                      { field: 'shipping_address', label: 'Shipping Address' },
                      { field: 'wallet_address', label: 'Wallet Address' },
                      { field: 'twitter_handle', label: 'X (Twitter)' },
                      { field: 'instagram_handle', label: 'Instagram' },
                      { field: 'discord_username', label: 'Discord' },
                      { field: 'twitch_username', label: 'Twitch' },
                      { field: 'telegram_handle', label: 'Telegram' },
                      { field: 'youtube_channel', label: 'YouTube' },
                    ] as { field: RequiredDataField; label: string }[]).map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`field-${field}`}
                          checked={formData.required_user_data.includes(field)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                required_user_data: [...formData.required_user_data, field]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                required_user_data: formData.required_user_data.filter(f => f !== field)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`field-${field}`} className="text-xs cursor-pointer">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Instructions */}
                <div className="space-y-2">
                  <Label className="text-sm">Delivery Instructions (Optional)</Label>
                  <Textarea 
                    value={formData.delivery_instructions || ''}
                    onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value || null })}
                    placeholder="Instructions shown to user after claiming (e.g., how to redeem, what to expect)..."
                    rows={2}
                  />
                </div>
              </div>
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

      {/* Bulk Sponsorship Modal */}
      <Dialog open={showBulkSponsorModal} onOpenChange={setShowBulkSponsorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" /> Add Sponsorship to {selectedIds.size} Rewards
            </DialogTitle>
            <DialogDescription>
              Apply the same sponsor to all selected rewards
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sponsor Name *</Label>
              <Input
                value={bulkSponsorData.sponsor_name}
                onChange={(e) => setBulkSponsorData({ ...bulkSponsorData, sponsor_name: e.target.value })}
                placeholder="e.g., Nike, NCTR Alliance"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Sponsor Logo URL *</Label>
              <Input
                value={bulkSponsorData.sponsor_logo}
                onChange={(e) => setBulkSponsorData({ ...bulkSponsorData, sponsor_logo: e.target.value })}
                placeholder="https://..."
              />
              {bulkSponsorData.sponsor_logo && (
                <div className="mt-2 p-2 bg-muted rounded border">
                  <img
                    src={bulkSponsorData.sponsor_logo}
                    alt="Logo preview"
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Sponsor Link (optional)</Label>
              <Input
                value={bulkSponsorData.sponsor_link}
                onChange={(e) => setBulkSponsorData({ ...bulkSponsorData, sponsor_link: e.target.value })}
                placeholder="https://sponsor-website.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={bulkSponsorData.sponsor_start_date}
                  onChange={(e) => setBulkSponsorData({ ...bulkSponsorData, sponsor_start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={bulkSponsorData.sponsor_end_date}
                  onChange={(e) => setBulkSponsorData({ ...bulkSponsorData, sponsor_end_date: e.target.value })}
                />
              </div>
            </div>
            
            {bulkSponsorData.sponsor_end_date && bulkSponsorData.sponsor_start_date && 
             new Date(bulkSponsorData.sponsor_end_date) < new Date(bulkSponsorData.sponsor_start_date) && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                End date must be after start date
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkSponsorModal(false);
              setBulkSponsorData({
                sponsor_name: '',
                sponsor_logo: '',
                sponsor_link: '',
                sponsor_start_date: '',
                sponsor_end_date: '',
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleBulkSponsor} disabled={bulkSponsorSaving}>
              {bulkSponsorSaving ? 'Applying...' : `Apply to ${selectedIds.size} Rewards`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
