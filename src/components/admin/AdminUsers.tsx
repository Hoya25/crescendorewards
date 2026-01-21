import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, MoreHorizontal, Eye, Coins, Gift, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useAdminRole } from '@/hooks/useAdminRole';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
  locked_nctr: number;
  available_nctr: number;
  claim_balance: number;
  referral_code: string | null;
  referred_by: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
  has_status_access_pass: boolean;
}

interface Reward {
  id: string;
  title: string;
  cost: number;
  image_url: string | null;
  category: string;
}

const USERS_PER_PAGE = 20;

const tierConfig: Record<number, { name: string; color: string }> = {
  0: { name: 'Level 1', color: 'bg-muted text-muted-foreground' },
  1: { name: 'Bronze', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  2: { name: 'Silver', color: 'bg-slate-400/20 text-slate-600 dark:text-slate-300' },
  3: { name: 'Gold', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  4: { name: 'Platinum', color: 'bg-slate-500/20 text-slate-700 dark:text-slate-200' },
  5: { name: 'Diamond', color: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' },
};

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

export function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission, logActivity } = useAdminRole();
  
  // State
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  
  // Adjust claims form state
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('compensation');
  const [adjustNotes, setAdjustNotes] = useState('');
  
  // Gift reward state
  const [rewardSearch, setRewardSearch] = useState('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', search, filter, sortBy, page],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      
      // Apply search
      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,referral_code.ilike.%${search}%`);
      }
      
      // Apply filters
      switch (filter) {
        case 'has_wallet':
          query = query.not('wallet_address', 'is', null);
          break;
        case 'premium':
          query = query.gte('level', 2);
          break;
        case 'recent':
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          query = query.gte('created_at', sevenDaysAgo.toISOString());
          break;
      }
      
      // Apply sorting
      const ascending = sortBy === 'created_at' ? false : true;
      switch (sortBy) {
        case 'created_at':
          query = query.order('created_at', { ascending: false });
          break;
        case 'nctr':
          query = query.order('locked_nctr', { ascending: false });
          break;
        case 'claims':
          query = query.order('claim_balance', { ascending: false });
          break;
        case 'level':
          query = query.order('level', { ascending: false });
          break;
      }
      
      // Pagination
      const from = (page - 1) * USERS_PER_PAGE;
      const to = from + USERS_PER_PAGE - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { users: data as UserProfile[], totalCount: count || 0 };
    },
  });

  // Fetch claims count for each user
  const { data: claimsCounts } = useQuery({
    queryKey: ['admin-users-claims-counts', usersData?.users?.map(u => u.id)],
    queryFn: async () => {
      if (!usersData?.users?.length) return {};
      
      const { data, error } = await supabase
        .from('rewards_claims')
        .select('user_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(claim => {
        counts[claim.user_id] = (counts[claim.user_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!usersData?.users?.length,
  });

  // Fetch rewards for gift modal
  const { data: rewards } = useQuery({
    queryKey: ['admin-active-rewards', rewardSearch],
    queryFn: async () => {
      let query = supabase
        .from('rewards')
        .select('id, title, cost, image_url, category')
        .eq('is_active', true)
        .order('title');
      
      if (rewardSearch) {
        query = query.ilike('title', `%${rewardSearch}%`);
      }
      
      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data as Reward[];
    },
    enabled: giftModalOpen,
  });

  // Adjust claims mutation
  const adjustClaimsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !adjustAmount) return;
      
      const amount = parseInt(adjustAmount);
      const newBalance = adjustType === 'add' 
        ? selectedUser.claim_balance + amount 
        : selectedUser.claim_balance - amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ claim_balance: Math.max(0, newBalance) })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Claims adjusted successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setAdjustModalOpen(false);
      resetAdjustForm();
    },
    onError: (error) => {
      toast({ title: 'Failed to adjust claims', description: error.message, variant: 'destructive' });
    },
  });

  // Gift reward mutation
  const giftRewardMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !selectedReward) return;
      
      const { data, error } = await supabase.rpc('admin_gift_reward', {
        p_user_id: selectedUser.id,
        p_reward_id: selectedReward.id,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) throw new Error(result.error || 'Failed to gift reward');
      
      return result;
    },
    onSuccess: (data) => {
      toast({ title: 'Reward gifted!', description: data?.message });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setGiftModalOpen(false);
      setSelectedReward(null);
      setRewardSearch('');
    },
    onError: (error) => {
      toast({ title: 'Failed to gift reward', description: error.message, variant: 'destructive' });
    },
  });

  const resetAdjustForm = () => {
    setAdjustType('add');
    setAdjustAmount('');
    setAdjustReason('compensation');
    setAdjustNotes('');
  };

  const handleCopyAddress = async () => {
    if (selectedUser?.wallet_address) {
      await navigator.clipboard.writeText(selectedUser.wallet_address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const totalPages = Math.ceil((usersData?.totalCount || 0) / USERS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">View and manage all users</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or referral code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="has_wallet">Has Wallet</SelectItem>
            <SelectItem value="premium">Premium Tiers</SelectItem>
            <SelectItem value="recent">Recent (7 days)</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Join Date</SelectItem>
            <SelectItem value="nctr">NCTR Balance</SelectItem>
            <SelectItem value="claims">Claim Balance</SelectItem>
            <SelectItem value="level">Tier Level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Locked NCTR</TableHead>
              <TableHead className="text-right">Claims</TableHead>
              <TableHead className="text-right">Total Claims</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : usersData?.users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              usersData?.users?.map((user) => {
                const tier = tierConfig[user.level] || tierConfig[0];
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(user.full_name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={tier.color}>{tier.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {user.locked_nctr.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {user.claim_balance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {claimsCounts?.[user.id] || 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setProfileModalOpen(true); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <PermissionGate permission="users_edit">
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setAdjustModalOpen(true); }}>
                              <Coins className="h-4 w-4 mr-2" />
                              Adjust Claims
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setGiftModalOpen(true); }}>
                              <Gift className="h-4 w-4 mr-2" />
                              Gift Reward
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * USERS_PER_PAGE) + 1}-{Math.min(page * USERS_PER_PAGE, usersData?.totalCount || 0)} of {usersData?.totalCount} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>View detailed user information</DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">{getInitials(selectedUser.full_name, selectedUser.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.full_name || 'Unnamed User'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <Badge className={tierConfig[selectedUser.level]?.color || tierConfig[0].color}>
                    {tierConfig[selectedUser.level]?.name || 'Level 1'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Locked NCTR</p>
                  <p className="font-mono font-medium">{selectedUser.locked_nctr.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Available NCTR</p>
                  <p className="font-mono font-medium">{selectedUser.available_nctr.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Claim Balance</p>
                  <p className="font-mono font-medium">{selectedUser.claim_balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Referral Code</p>
                  <p className="font-mono">{selectedUser.referral_code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Referred By</p>
                  <p className="font-mono">{selectedUser.referred_by || 'None'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status Access Pass</p>
                  <p>{selectedUser.has_status_access_pass ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {selectedUser.wallet_address && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono truncate">
                      {selectedUser.wallet_address}
                    </code>
                    <Button variant="outline" size="icon" onClick={handleCopyAddress}>
                      {copiedAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Active</p>
                  <p>{formatDistanceToNow(new Date(selectedUser.updated_at), { addSuffix: true })}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Claims Modal */}
      <Dialog open={adjustModalOpen} onOpenChange={(open) => { setAdjustModalOpen(open); if (!open) resetAdjustForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Claims Balance</DialogTitle>
            <DialogDescription>
              Modify claim balance for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold font-mono">{selectedUser.claim_balance.toLocaleString()} Claims</p>
              </div>
              
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <RadioGroup value={adjustType} onValueChange={(v) => setAdjustType(v as 'add' | 'subtract')} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="add" />
                    <Label htmlFor="add" className="cursor-pointer">Add</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="subtract" id="subtract" />
                    <Label htmlFor="subtract" className="cursor-pointer">Subtract</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={adjustReason} onValueChange={setAdjustReason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compensation">Compensation</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                    <SelectItem value="gift">Gift</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this adjustment..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => adjustClaimsMutation.mutate()}
              disabled={!adjustAmount || adjustClaimsMutation.isPending}
            >
              {adjustClaimsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Reward Modal */}
      <Dialog open={giftModalOpen} onOpenChange={(open) => { setGiftModalOpen(open); if (!open) { setSelectedReward(null); setRewardSearch(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gift Reward</DialogTitle>
            <DialogDescription>
              Gift a reward to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rewards..."
                value={rewardSearch}
                onChange={(e) => setRewardSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {rewards?.map((reward) => (
                <div
                  key={reward.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReward?.id === reward.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedReward(reward)}
                >
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {reward.image_url ? (
                      <img src={reward.image_url} alt={reward.title} className="h-full w-full object-cover" />
                    ) : (
                      <Gift className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{reward.title}</p>
                    <p className="text-sm text-muted-foreground">{reward.category} • {reward.cost} Claims</p>
                  </div>
                </div>
              ))}
              
              {rewards?.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">No rewards found</p>
              )}
            </div>
            
            {selectedReward && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Selected Reward</p>
                <p className="font-medium">{selectedReward.title}</p>
                <p className="text-sm text-muted-foreground">Will gift {selectedReward.cost} claims to purchase this reward</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setGiftModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => giftRewardMutation.mutate()}
              disabled={!selectedReward || giftRewardMutation.isPending}
            >
              {giftRewardMutation.isPending ? 'Gifting...' : 'Gift Reward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
