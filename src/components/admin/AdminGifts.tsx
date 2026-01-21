import { useState, useEffect, useCallback } from 'react';
import { Gift, Users, TrendingUp, Clock, Search, Plus, Send, ShieldCheck, User, X, Calendar, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { useAdminGifts } from '@/hooks/useAdminGifts';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { ClaimGift, GiftStats, GiftFilters } from '@/types/gifts';

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
    case 'claimed':
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Claimed</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Expired</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminGifts() {
  const {
    isLoading,
    creditClaims,
    sendAdminGift,
    getAllGifts,
    cancelGift,
    extendGiftExpiry,
    getGiftStats,
    searchUsers
  } = useAdminGifts();

  const [stats, setStats] = useState<GiftStats | null>(null);
  const [gifts, setGifts] = useState<ClaimGift[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filters, setFilters] = useState<GiftFilters>({ status: 'all', type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  // Credit User Modal State
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditMessage, setCreditMessage] = useState('');
  const [creditAdminNotes, setCreditAdminNotes] = useState('');
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string;
  } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<Array<{
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string;
  }>>([]);

  // Send Gift Modal State
  const [showSendGiftModal, setShowSendGiftModal] = useState(false);
  const [giftRecipientEmail, setGiftRecipientEmail] = useState('');
  const [giftAmount, setGiftAmount] = useState<number>(0);
  const [giftMessage, setGiftMessage] = useState('');
  const [giftAdminNotes, setGiftAdminNotes] = useState('');

  // Extend Expiry Modal State
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendGiftId, setExtendGiftId] = useState<string | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | undefined>();

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [statsData, giftsData] = await Promise.all([
      getGiftStats(),
      getAllGifts(filters)
    ]);
    setStats(statsData);
    setGifts(giftsData);
    setLoadingData(false);
  }, [getGiftStats, getAllGifts, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (userSearchQuery.length >= 2) {
        const results = await searchUsers(userSearchQuery);
        setUserSearchResults(results);
      } else {
        setUserSearchResults([]);
      }
    };
    const timer = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, searchUsers]);

  const handleCreditUser = async () => {
    if (!selectedUser || creditAmount <= 0) return;
    
    const result = await creditClaims(selectedUser.id, creditAmount, creditMessage || undefined, creditAdminNotes || undefined);
    
    if (result.success) {
      setShowCreditModal(false);
      resetCreditForm();
      loadData();
    }
  };

  const handleSendGift = async () => {
    if (!giftRecipientEmail || giftAmount <= 0) return;
    
    const result = await sendAdminGift(giftRecipientEmail, giftAmount, giftMessage || undefined, giftAdminNotes || undefined);
    
    if (result.success) {
      setShowSendGiftModal(false);
      resetGiftForm();
      loadData();
      if (result.giftCode) {
        toast.success(`Gift code: ${result.giftCode}`, {
          action: {
            label: 'Copy',
            onClick: () => navigator.clipboard.writeText(result.giftCode!)
          }
        });
      }
    }
  };

  const handleCancelGift = async (giftId: string) => {
    const result = await cancelGift(giftId);
    if (result.success) {
      loadData();
    }
  };

  const handleExtendExpiry = async () => {
    if (!extendGiftId || !newExpiryDate) return;
    
    const result = await extendGiftExpiry(extendGiftId, newExpiryDate);
    if (result.success) {
      setShowExtendModal(false);
      setExtendGiftId(null);
      setNewExpiryDate(undefined);
      loadData();
    }
  };

  const resetCreditForm = () => {
    setSelectedUser(null);
    setCreditAmount(0);
    setCreditMessage('');
    setCreditAdminNotes('');
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const resetGiftForm = () => {
    setGiftRecipientEmail('');
    setGiftAmount(0);
    setGiftMessage('');
    setGiftAdminNotes('');
  };

  const filteredGifts = searchQuery
    ? gifts.filter(g => 
        g.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.gift_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.recipient?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : gifts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Gift Management
          </h1>
          <p className="text-muted-foreground">Manage claim gifts and credits</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreditModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Credit User
          </Button>
          <Button variant="outline" onClick={() => setShowSendGiftModal(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Gift Code
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_gifts || 0}</p>
                <p className="text-sm text-muted-foreground">Total Gifts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_claims_gifted?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Claims Gifted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending_gifts || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.admin_gifts || 0}</p>
                <p className="text-sm text-muted-foreground">Admin Gifts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, code, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => setFilters(f => ({ ...f, status: v as any }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.type || 'all'}
              onValueChange={(v) => setFilters(f => ({ ...f, type: v as any }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="admin">Admin Gifts</SelectItem>
                <SelectItem value="user">User Gifts</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gifts Table */}
      <Card>
        <CardContent className="p-0">
          {loadingData ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredGifts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No gifts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell>
                      {gift.is_admin_gift ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          User
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={gift.sender?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {gift.is_admin_gift ? '🛡️' : (gift.sender?.display_name || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px] text-sm">
                          {gift.is_admin_gift ? 'Admin' : gift.sender?.display_name || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={gift.recipient?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {(gift.recipient?.display_name || gift.recipient_email || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[120px] text-sm">
                          {gift.recipient?.display_name || gift.recipient_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{gift.claims_amount}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{gift.gift_code}</code>
                    </TableCell>
                    <TableCell>{getStatusBadge(gift.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(gift.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(gift.gift_code);
                            toast.success('Code copied!');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {gift.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExtendGiftId(gift.id);
                                setNewExpiryDate(new Date(gift.expires_at));
                                setShowExtendModal(true);
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelGift(gift.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Credit User Modal */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Credit User</DialogTitle>
            <DialogDescription>Instantly add Claims to a user's balance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* User Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search User</label>
              <Input
                placeholder="Search by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
              {userSearchResults.length > 0 && !selectedUser && (
                <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-auto">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      className="w-full flex items-center gap-3 p-2 hover:bg-muted text-left"
                      onClick={() => {
                        setSelectedUser(user);
                        setUserSearchQuery('');
                        setUserSearchResults([]);
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>{user.display_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.display_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected User */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback>{selectedUser.display_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedUser.display_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="text-sm font-medium mb-2 block">Claims Amount</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant={creditAmount === amt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreditAmount(amt)}
                  >
                    {amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount"
                value={creditAmount || ''}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium mb-2 block">Message to User (optional)</label>
              <Textarea
                placeholder="Congratulations! You've earned bonus claims..."
                value={creditMessage}
                onChange={(e) => setCreditMessage(e.target.value)}
                rows={2}
              />
            </div>

            {/* Admin Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Admin Notes (internal)</label>
              <Input
                placeholder="Compensation for issue #123"
                value={creditAdminNotes}
                onChange={(e) => setCreditAdminNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreditModal(false); resetCreditForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreditUser}
              disabled={!selectedUser || creditAmount <= 0 || isLoading}
            >
              {isLoading ? 'Crediting...' : `Credit ${creditAmount} Claims`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Gift Modal */}
      <Dialog open={showSendGiftModal} onOpenChange={setShowSendGiftModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Gift Code</DialogTitle>
            <DialogDescription>Create a gift code that can be claimed by the recipient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Recipient Email */}
            <div>
              <label className="text-sm font-medium mb-2 block">Recipient Email</label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={giftRecipientEmail}
                onChange={(e) => setGiftRecipientEmail(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium mb-2 block">Claims Amount</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant={giftAmount === amt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGiftAmount(amt)}
                  >
                    {amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount"
                value={giftAmount || ''}
                onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium mb-2 block">Personal Message (optional)</label>
              <Textarea
                placeholder="You've been gifted Claims!"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                rows={2}
              />
            </div>

            {/* Admin Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Admin Notes (internal)</label>
              <Input
                placeholder="Promotional gift for..."
                value={giftAdminNotes}
                onChange={(e) => setGiftAdminNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSendGiftModal(false); resetGiftForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSendGift}
              disabled={!giftRecipientEmail || giftAmount <= 0 || isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Gift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Expiry Modal */}
      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Extend Gift Expiry</DialogTitle>
            <DialogDescription>Select a new expiration date</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <CalendarPicker
              mode="single"
              selected={newExpiryDate}
              onSelect={setNewExpiryDate}
              disabled={(date) => date < new Date()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendExpiry} disabled={!newExpiryDate || isLoading}>
              {isLoading ? 'Updating...' : 'Update Expiry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
