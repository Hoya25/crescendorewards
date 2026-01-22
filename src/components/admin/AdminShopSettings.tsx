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
import { toast } from 'sonner';
import { Loader2, Save, ShoppingBag, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ShopSettings {
  id: string;
  store_identifier: string;
  nctr_per_dollar: number;
  minimum_purchase: number;
  is_active: boolean;
  updated_at: string;
}

interface ShopTransaction {
  id: string;
  order_number: string;
  customer_email: string | null;
  customer_name: string | null;
  order_total: number;
  nctr_earned: number;
  status: string;
  created_at: string;
}

export function AdminShopSettings() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [transactions, setTransactions] = useState<ShopTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nctrPerDollar, setNctrPerDollar] = useState<number>(1.0);
  const [minimumPurchase, setMinimumPurchase] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

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
        setMinimumPurchase(Number(settingsData.minimum_purchase));
        setIsActive(settingsData.is_active);
      }

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('shop_transactions')
        .select('*')
        .eq('store_identifier', 'nctr-merch')
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
          minimum_purchase: minimumPurchase,
          is_active: isActive,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'credited':
        return <Badge className="bg-[#D4FF00] text-black hover:bg-[#D4FF00]/80">Credited</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
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
              value={minimumPurchase}
              onChange={(e) => setMinimumPurchase(Number(e.target.value))}
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
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">NCTR Earned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">
                        {tx.order_number}
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
                          +{Number(tx.nctr_earned).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tx.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
