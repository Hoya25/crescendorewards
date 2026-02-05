import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Save, ShoppingBag, RefreshCw, TestTube2, Link2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

interface ShopSettings {
  id: string;
  store_identifier: string;
  store_name: string;
  nctr_per_dollar: number;
  min_purchase_for_reward: number;
  max_nctr_per_order: number | null;
  is_active: boolean;
  updated_at: string;
}

interface ShopTransaction {
  id: string;
  order_id: string;
  order_number: string | null;
  customer_email: string | null;
  customer_name: string | null;
  order_total: number;
  currency: string;
  user_id: string | null;
  nctr_per_dollar_at_time: number;
  nctr_earned: number;
  status: string;
  credited_at: string | null;
  created_at: string;
}

interface UserSearchResult {
  id: string;
  display_name: string | null;
  email: string | null;
}

export function AdminShopSettings() {
  const { profile } = useUnifiedUser();
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [transactions, setTransactions] = useState<ShopTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);

  // Form state
  const [nctrPerDollar, setNctrPerDollar] = useState<number>(1.0);
  const [minPurchase, setMinPurchase] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Link user modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingTransaction, setLinkingTransaction] = useState<ShopTransaction | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [linkingUser, setLinkingUser] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('store_identifier', 'nctr-merch')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settingsData) {
        setSettings(settingsData);
        setNctrPerDollar(Number(settingsData.nctr_per_dollar));
        setMinPurchase(Number(settingsData.min_purchase_for_reward || settingsData.minimum_purchase || 0));
        setIsActive(settingsData.is_active);
      }

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('shop_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (txError) throw txError;
      setTransactions(txData || []);
    } catch (error) {
      console.error('Error fetching shop data:', error);
      toast.error('Failed to load shop settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shop_settings')
        .update({
          nctr_per_dollar: nctrPerDollar,
          min_purchase_for_reward: minPurchase,
          minimum_purchase: minPurchase, // Keep backward compat
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('store_identifier', 'nctr-merch');

      if (error) throw error;

      toast.success('Shop settings saved successfully');
      await fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTestTransaction = async () => {
    if (!profile) {
      toast.error('You must be logged in to create a test transaction');
      return;
    }

    setCreatingTest(true);
    try {
      // Get current settings
      const { data: settingsData } = await supabase
        .from('shop_settings')
        .select('nctr_per_dollar')
        .eq('store_identifier', 'nctr-merch')
        .single();

      const rate = settingsData?.nctr_per_dollar || 1.0;
      const orderTotal = 25.0;
      const nctrEarned = orderTotal * Number(rate);

      const { error } = await supabase
        .from('shop_transactions')
        .insert({
          order_id: `TEST-${Date.now()}`,
          order_number: `TEST-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
          order_total: orderTotal,
          currency: 'USD',
          customer_email: profile.email,
          customer_name: profile.display_name,
          user_id: profile.id,
          nctr_per_dollar_at_time: rate,
          nctr_earned: nctrEarned,
          status: 'credited',
          credited_at: new Date().toISOString(),
          store_identifier: 'nctr-merch',
        });

      if (error) throw error;

      toast.success(`Test transaction created — ${nctrEarned.toFixed(2)} NCTR earned`);
      await fetchData();
    } catch (error) {
      console.error('Error creating test transaction:', error);
      toast.error('Failed to create test transaction');
    } finally {
      setCreatingTest(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!userSearchQuery.trim()) return;
    
    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from('unified_profiles')
        .select('id, display_name, email')
        .or(`display_name.ilike.%${userSearchQuery}%,email.ilike.%${userSearchQuery}%`)
        .limit(10);

      if (error) throw error;
      setUserSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleLinkUser = async (userId: string) => {
    if (!linkingTransaction) return;

    setLinkingUser(true);
    try {
      const { error } = await supabase
        .from('shop_transactions')
        .update({
          user_id: userId,
          status: 'credited',
          credited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkingTransaction.id);

      if (error) throw error;

      toast.success(`Transaction linked and ${linkingTransaction.nctr_earned.toFixed(2)} NCTR credited`);
      setLinkModalOpen(false);
      setLinkingTransaction(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
      await fetchData();
    } catch (error) {
      console.error('Error linking user:', error);
      toast.error('Failed to link user');
    } finally {
      setLinkingUser(false);
    }
  };

  const openLinkModal = (tx: ShopTransaction) => {
    setLinkingTransaction(tx);
    setLinkModalOpen(true);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const getStatusBadge = (status: string, userId: string | null) => {
    if (status === 'pending' && !userId) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending - No matching user</Badge>;
    }
    switch (status) {
      case 'credited':
        return <Badge className="bg-[#D4FF00] text-black hover:bg-[#D4FF00]/80">Credited</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-[#D4FF00]/10">
          <ShoppingBag className="w-6 h-6 text-[#D4FF00]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">NCTR Shop Settings</h1>
          <p className="text-muted-foreground">Configure token rewards for merch purchases</p>
        </div>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Reward Configuration</CardTitle>
          <CardDescription>
            Control how customers earn NCTR from shop purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* NCTR per Dollar */}
          <div className="space-y-2">
            <Label htmlFor="nctr-per-dollar">NCTR per Dollar Spent</Label>
            <Input
              id="nctr-per-dollar"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={nctrPerDollar}
              onChange={(e) => setNctrPerDollar(Number(e.target.value))}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Customers earn this many NCTR for each dollar spent
            </p>
          </div>

          {/* Minimum Purchase */}
          <div className="space-y-2">
            <Label htmlFor="min-purchase">Minimum Purchase (USD)</Label>
            <Input
              id="min-purchase"
              type="number"
              step="1"
              min="0"
              value={minPurchase}
              onChange={(e) => setMinPurchase(Number(e.target.value))}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Minimum order total to earn NCTR (in USD)
            </p>
          </div>

          {/* Shop Active Toggle */}
          <div className="flex items-center justify-between max-w-xs p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label>Shop Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable NCTR rewards for shop purchases
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#D4FF00] text-black hover:bg-[#D4FF00]/80"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>

          {settings?.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated: {format(new Date(settings.updated_at), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Shop Transactions</CardTitle>
            <CardDescription>
              Last 20 purchases from the NCTR merch store
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCreateTestTransaction}
              disabled={creatingTest}
            >
              {creatingTest ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube2 className="w-4 h-4 mr-2" />
              )}
              Test Transaction
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Shop purchases will appear here</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">NCTR Earned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {tx.order_number || tx.order_id?.slice(0, 12)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.customer_name || 'Guest'}</p>
                          {tx.customer_email && (
                            <p className="text-xs text-muted-foreground">{tx.customer_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(tx.order_total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-[#D4FF00] font-medium">
                          +{Number(tx.nctr_earned).toLocaleString(undefined, { maximumFractionDigits: 2 })} NCTR
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status, tx.user_id)}</TableCell>
                      <TableCell>
                        {tx.status === 'pending' && !tx.user_id && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openLinkModal(tx)}
                          >
                            <Link2 className="w-4 h-4 mr-1" />
                            Link
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link User Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Transaction to User</DialogTitle>
            <DialogDescription>
              Search for a user by name or email to credit this transaction.
              {linkingTransaction && (
                <span className="block mt-2 font-medium text-foreground">
                  Order: {linkingTransaction.order_number} — {Number(linkingTransaction.nctr_earned).toFixed(2)} NCTR
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
              />
              <Button onClick={handleSearchUsers} disabled={searchingUsers}>
                {searchingUsers ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {userSearchResults.length > 0 && (
              <div className="border rounded-md divide-y max-h-60 overflow-auto">
                {userSearchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center"
                    onClick={() => handleLinkUser(user.id)}
                  >
                    <div>
                      <p className="font-medium">{user.display_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {linkingUser ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Button size="sm" variant="outline">Select</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {userSearchQuery && userSearchResults.length === 0 && !searchingUsers && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found matching "{userSearchQuery}"
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
