import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  CalendarIcon, 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal,
  Copy,
  ExternalLink,
  User,
  Package,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Loader2,
  PartyPopper,
  Mail,
  Wallet,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { DELIVERY_METHOD_LABELS } from '@/types/delivery';

interface Claim {
  claim_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  reward_id: string;
  reward_title: string;
  reward_cost: number;
  status: string;
  claimed_at: string;
  shipping_info: any;
  delivery_method: string | null;
  delivery_status: string | null;
  delivery_data: any;
  delivered_at: string | null;
}

type SortField = 'claimed_at' | 'status' | 'reward_cost' | 'user_name' | 'delivery_status';
type SortOrder = 'asc' | 'desc';

const STATUS_TABS = ['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'] as const;
type StatusTab = typeof STATUS_TABS[number];

const DELIVERY_STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'failed'] as const;
type DeliveryStatus = typeof DELIVERY_STATUS_OPTIONS[number];

const CATEGORIES = ['All Categories', 'Merchandise', 'Gift Cards', 'Experiences', 'Digital', 'Partner Rewards', 'Luxury', 'Limited Edition'];

export function AdminClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingInfo, setTrackingInfo] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('claimed_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_claims') as { data: Claim[] | null; error: any };

      if (error) throw error;
      setClaims(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load claims',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort claims
  const filteredClaims = useMemo(() => {
    let result = [...claims];

    // Filter by status tab
    if (activeTab !== 'all') {
      result = result.filter(claim => claim.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(claim =>
        claim.user_email?.toLowerCase().includes(query) ||
        claim.user_name?.toLowerCase().includes(query) ||
        claim.reward_title?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (dateRange?.from) {
      result = result.filter(claim => {
        const claimDate = new Date(claim.claimed_at);
        if (dateRange.to) {
          return claimDate >= dateRange.from! && claimDate <= dateRange.to;
        }
        return claimDate >= dateRange.from!;
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'claimed_at':
          aVal = new Date(a.claimed_at).getTime();
          bVal = new Date(b.claimed_at).getTime();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'reward_cost':
          aVal = a.reward_cost;
          bVal = b.reward_cost;
          break;
        case 'user_name':
          aVal = a.user_name?.toLowerCase() || '';
          bVal = b.user_name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [claims, activeTab, searchQuery, dateRange, sortField, sortOrder]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: claims.length };
    STATUS_TABS.forEach(status => {
      if (status !== 'all') {
        counts[status] = claims.filter(c => c.status === status).length;
      }
    });
    return counts;
  }, [claims]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleRowExpanded = (claimId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(claimId)) {
        newSet.delete(claimId);
      } else {
        newSet.add(claimId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClaims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClaims.map(c => c.claim_id)));
    }
  };

  const toggleSelect = (claimId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(claimId)) {
        newSet.delete(claimId);
      } else {
        newSet.add(claimId);
      }
      return newSet;
    });
  };

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setNewStatus(claim.status);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedClaim) return;

    try {
      setUpdatingStatus(true);
      const { data, error } = await supabase.rpc('update_claim_status', {
        p_claim_id: selectedClaim.claim_id,
        p_status: newStatus,
      }) as { data: any; error: any };

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      toast({
        title: 'Success',
        description: 'Claim status updated successfully',
      });

      setShowDetailModal(false);
      loadClaims();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update claim status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;

    try {
      setBulkUpdating(true);
      const promises = Array.from(selectedIds).map(id =>
        supabase.rpc('update_claim_status', { p_claim_id: id, p_status: status })
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `Updated ${selectedIds.size} claims to ${status}`,
      });

      setSelectedIds(new Set());
      loadClaims();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update claims',
        variant: 'destructive',
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkShipped = () => {
    setShowTrackingModal(true);
  };

  const handleConfirmBulkShipped = async () => {
    await handleBulkUpdateStatus('shipped');
    setShowTrackingModal(false);
    setTrackingInfo('');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const formatAddress = (shipping: any) => {
    if (!shipping) return '';
    const parts = [
      shipping.name,
      shipping.address,
      `${shipping.city}, ${shipping.state} ${shipping.zip}`,
      shipping.country
    ].filter(Boolean);
    return parts.join('\n');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      pending: { 
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', 
        icon: <Clock className="w-3 h-3 mr-1" /> 
      },
      processing: { 
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', 
        icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 
      },
      shipped: { 
        className: 'bg-purple-500/10 text-purple-600 border-purple-500/20', 
        icon: <Truck className="w-3 h-3 mr-1" /> 
      },
      completed: { 
        className: 'bg-green-500/10 text-green-600 border-green-500/20', 
        icon: <CheckCircle2 className="w-3 h-3 mr-1" /> 
      },
      cancelled: { 
        className: 'bg-red-500/10 text-red-600 border-red-500/20', 
        icon: <XCircle className="w-3 h-3 mr-1" /> 
      },
    };
    const { className, icon } = config[status] || { className: '', icon: null };
    return (
      <Badge variant="outline" className={cn('flex items-center w-fit', className)}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDeliveryStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground text-sm">—</span>;
    
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      pending: { 
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', 
        icon: <Clock className="w-3 h-3 mr-1" /> 
      },
      processing: { 
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', 
        icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 
      },
      shipped: { 
        className: 'bg-purple-500/10 text-purple-600 border-purple-500/20', 
        icon: <Truck className="w-3 h-3 mr-1" /> 
      },
      delivered: { 
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', 
        icon: <CheckCircle2 className="w-3 h-3 mr-1" /> 
      },
      failed: { 
        className: 'bg-red-500/10 text-red-600 border-red-500/20', 
        icon: <XCircle className="w-3 h-3 mr-1" /> 
      },
    };
    const { className, icon } = config[status] || { className: 'bg-muted', icon: null };
    return (
      <Badge variant="outline" className={cn('flex items-center w-fit text-xs', className)}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDeliveryMethodBadge = (method: string | null) => {
    if (!method) return <span className="text-muted-foreground text-sm">—</span>;
    
    const label = DELIVERY_METHOD_LABELS[method as keyof typeof DELIVERY_METHOD_LABELS]?.label || method;
    const iconMap: Record<string, React.ReactNode> = {
      email: <Mail className="w-3 h-3 mr-1" />,
      wallet_transfer: <Wallet className="w-3 h-3 mr-1" />,
      shipping: <Truck className="w-3 h-3 mr-1" />,
      instant_code: <CheckCircle2 className="w-3 h-3 mr-1" />,
      platform_delivery: <Send className="w-3 h-3 mr-1" />,
    };
    
    return (
      <Badge variant="secondary" className="flex items-center w-fit text-xs">
        {iconMap[method] || null}
        {label}
      </Badge>
    );
  };

  const handleUpdateDeliveryStatus = async (claimId: string, newDeliveryStatus: string) => {
    try {
      const { data, error } = await supabase.rpc('update_claim_delivery_status', {
        p_claim_id: claimId,
        p_delivery_status: newDeliveryStatus,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update delivery status');
      }

      toast({
        title: 'Success',
        description: `Delivery status updated to ${newDeliveryStatus}`,
      });

      loadClaims();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update delivery status',
        variant: 'destructive',
      });
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['completed'],
      completed: [],
      cancelled: ['pending'],
    };
    return transitions[currentStatus] || [];
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className={cn(
        "ml-2 h-4 w-4",
        sortField === field && "text-primary"
      )} />
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Claims Management</h2>
        <p className="text-muted-foreground mt-1">Process and manage reward claims</p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusTab)}>
        <TabsList className="grid w-full grid-cols-6">
          {STATUS_TABS.map(tab => (
            <TabsTrigger key={tab} value={tab} className="relative">
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {statusCounts[tab] > 0 && tab !== 'all' && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-2 h-5 px-1.5 text-xs",
                    tab === 'pending' && "bg-amber-500/20 text-amber-600",
                    tab === 'processing' && "bg-blue-500/20 text-blue-600"
                  )}
                >
                  {statusCounts[tab]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user email, name, or reward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                'Date Range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
            {dateRange && (
              <div className="p-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setDateRange(undefined)}
                >
                  Clear Date Filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <span className="text-sm font-medium">
                {selectedIds.size} item{selectedIds.size !== 1 && 's'} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus('processing')}
                  disabled={bulkUpdating}
                >
                  Mark as Processing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkShipped}
                  disabled={bulkUpdating}
                >
                  Mark as Shipped
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkUpdateStatus('completed')}
                  disabled={bulkUpdating}
                >
                  Mark as Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedIds.size === filteredClaims.length && filteredClaims.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>
                  <SortableHeader field="user_name">User</SortableHeader>
                </TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>
                  <SortableHeader field="reward_cost">Cost</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="status">Status</SortableHeader>
                </TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>
                  <SortableHeader field="delivery_status">Fulfillment</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="claimed_at">Claimed</SortableHeader>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <PartyPopper className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No {activeTab !== 'all' ? activeTab : ''} claims</p>
                      <p className="text-muted-foreground">
                        {activeTab === 'pending' 
                          ? "You're all caught up! 🎉" 
                          : 'No claims match your current filters'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClaims.map((claim) => (
                  <Collapsible key={claim.claim_id} asChild>
                    <>
                      <TableRow className="group">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(claim.claim_id)}
                            onCheckedChange={() => toggleSelect(claim.claim_id)}
                          />
                        </TableCell>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleRowExpanded(claim.claim_id)}
                            >
                              {expandedRows.has(claim.claim_id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{claim.user_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{claim.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{claim.reward_title}</TableCell>
                        <TableCell>{claim.reward_cost} claims</TableCell>
                        <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        <TableCell>{getDeliveryMethodBadge(claim.delivery_method)}</TableCell>
                        <TableCell>{getDeliveryStatusBadge(claim.delivery_status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(claim.claimed_at), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(claim.claimed_at), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(claim)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* Claim Status Options */}
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Claim Status</div>
                              {getNextStatusOptions(claim.status).map(status => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={async () => {
                                    setSelectedClaim(claim);
                                    setNewStatus(status);
                                    const { error } = await supabase.rpc('update_claim_status', {
                                      p_claim_id: claim.claim_id,
                                      p_status: status,
                                    });
                                    if (error) {
                                      toast({ title: 'Error', description: error.message, variant: 'destructive' });
                                    } else {
                                      toast({ title: 'Success', description: `Marked as ${status}` });
                                      loadClaims();
                                    }
                                  }}
                                >
                                  Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              {/* Delivery Status Options */}
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Fulfillment Status</div>
                              {DELIVERY_STATUS_OPTIONS.filter(s => s !== claim.delivery_status).map(deliveryStatus => (
                                <DropdownMenuItem
                                  key={deliveryStatus}
                                  onClick={() => handleUpdateDeliveryStatus(claim.claim_id, deliveryStatus)}
                                >
                                  {deliveryStatus === 'delivered' && <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />}
                                  {deliveryStatus === 'shipped' && <Truck className="mr-2 h-4 w-4 text-purple-500" />}
                                  {deliveryStatus === 'processing' && <Loader2 className="mr-2 h-4 w-4 text-blue-500" />}
                                  {deliveryStatus === 'failed' && <XCircle className="mr-2 h-4 w-4 text-red-500" />}
                                  {deliveryStatus === 'pending' && <Clock className="mr-2 h-4 w-4 text-amber-500" />}
                                  Set {deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <a href={`/profile/${claim.user_id}`} target="_blank" rel="noopener noreferrer">
                                  <User className="mr-2 h-4 w-4" />
                                  View User Profile
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`/rewards/${claim.reward_id}`} target="_blank" rel="noopener noreferrer">
                                  <Package className="mr-2 h-4 w-4" />
                                  View Reward
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={8} className="p-0">
                            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Shipping Info */}
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Truck className="h-4 w-4" />
                                  Shipping Address
                                </h4>
                                {claim.shipping_info ? (
                                  <div className="space-y-2">
                                    <div className="text-sm whitespace-pre-line bg-background p-3 rounded-md border">
                                      {formatAddress(claim.shipping_info)}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyToClipboard(formatAddress(claim.shipping_info), 'Address')}
                                    >
                                      <Copy className="h-3 w-3 mr-2" />
                                      Copy Address
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No shipping info provided</p>
                                )}
                              </div>

                              {/* User Info */}
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  User Details
                                </h4>
                                <div className="space-y-2">
                                  <div className="text-sm bg-background p-3 rounded-md border">
                                    <p className="font-medium">{claim.user_name || 'Unknown'}</p>
                                    <p className="text-muted-foreground">{claim.user_email}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(claim.user_email, 'Email')}
                                  >
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copy Email
                                  </Button>
                                </div>
                              </div>

                              {/* Timeline */}
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Status Timeline
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <span>Claimed</span>
                                    <span className="text-muted-foreground ml-auto">
                                      {format(new Date(claim.claimed_at), 'MMM dd, yyyy HH:mm')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className={cn(
                                      "h-2 w-2 rounded-full",
                                      claim.status !== 'pending' ? "bg-primary" : "bg-muted-foreground/30"
                                    )} />
                                    <span className={claim.status === 'pending' ? 'text-muted-foreground' : ''}>
                                      Current: {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-lg">
          {selectedClaim && (
            <>
              <DialogHeader>
                <DialogTitle>Claim Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold mb-2">User Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedClaim.user_name || 'Not provided'}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedClaim.user_email}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Reward Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Reward:</span> {selectedClaim.reward_title}</p>
                    <p><span className="text-muted-foreground">Cost:</span> {selectedClaim.reward_cost} claims</p>
                    <p><span className="text-muted-foreground">Claimed:</span> {format(new Date(selectedClaim.claimed_at), 'PPP')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-muted-foreground">Delivery:</span>
                      {getDeliveryMethodBadge(selectedClaim.delivery_method)}
                    </div>
                  </div>
                </div>

                {selectedClaim.shipping_info && (
                  <div>
                    <h4 className="font-semibold mb-2">Shipping Information</h4>
                    <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">
                      {formatAddress(selectedClaim.shipping_info)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => copyToClipboard(formatAddress(selectedClaim.shipping_info), 'Address')}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Address
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Claim Status</h4>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Fulfillment Status</h4>
                    <Select 
                      value={selectedClaim.delivery_status || 'pending'} 
                      onValueChange={(value) => handleUpdateDeliveryStatus(selectedClaim.claim_id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedClaim.delivered_at && (
                  <div className="text-sm text-muted-foreground">
                    Delivered on: {format(new Date(selectedClaim.delivered_at), 'PPP')}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={updatingStatus}>
                  {updatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Status
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking Info Modal for Bulk Shipped */}
      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogDescription>
              Add tracking information for {selectedIds.size} selected claim{selectedIds.size !== 1 && 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tracking Info (optional)</label>
              <Input
                placeholder="Enter tracking number or notes"
                value={trackingInfo}
                onChange={(e) => setTrackingInfo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrackingModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBulkShipped} disabled={bulkUpdating}>
              {bulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
