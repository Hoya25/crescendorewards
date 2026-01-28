import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Coins, History, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdjustNCTRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string; // This is the profiles.id / auth user id
    display_name: string | null;
    email: string | null;
    current_nctr_locked: number;
    current_tier: string;
    unified_profile_id?: string;
  } | null;
  onSuccess: () => void;
}

const TIER_THRESHOLDS = {
  diamond: 10000,
  platinum: 2000,
  gold: 500,
  silver: 100,
  bronze: 0,
};

const TIER_EMOJIS: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

export function AdminAdjustNCTRModal({ open, onOpenChange, user, onSuccess }: AdjustNCTRModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity, adminUser } = useAdminRole();

  // Form state
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [amount, setAmount] = useState<number>(0);
  const [lockDuration, setLockDuration] = useState<'360' | '180' | '90' | '30'>('360');
  const [reason, setReason] = useState<string>('');
  const [useManualOverride, setUseManualOverride] = useState(false);
  const [overrideTier, setOverrideTier] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch unified profile ID for the user
  const { data: unifiedProfile } = useQuery({
    queryKey: ['unified-profile-for-adjustment', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('unified_profiles')
        .select('id, tier_override, tier_override_reason')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  // Fetch admin's unified profile ID
  const { data: adminUnifiedProfile } = useQuery({
    queryKey: ['admin-unified-profile', adminUser?.user_id],
    queryFn: async () => {
      if (!adminUser?.user_id) return null;
      const { data, error } = await supabase
        .from('unified_profiles')
        .select('id')
        .eq('id', adminUser.user_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!adminUser?.user_id && open,
  });

  // Fetch adjustment history
  const { data: adjustmentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['nctr-adjustments', unifiedProfile?.id],
    queryFn: async () => {
      if (!unifiedProfile?.id) return [];
      const { data, error } = await supabase
        .from('admin_nctr_adjustments')
        .select(`
          *,
          admin:admin_id (
            display_name,
            email
          )
        `)
        .eq('user_id', unifiedProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!unifiedProfile?.id && open,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAdjustmentType('add');
      setAmount(0);
      setLockDuration('360');
      setReason('');
      setUseManualOverride(false);
      setOverrideTier('');
    }
  }, [open]);

  // Pre-populate override tier if one exists
  useEffect(() => {
    if (unifiedProfile?.tier_override) {
      setUseManualOverride(true);
      setOverrideTier(unifiedProfile.tier_override);
    }
  }, [unifiedProfile]);

  const calculateNewBalance = () => {
    if (!user) return 0;
    switch (adjustmentType) {
      case 'add': return user.current_nctr_locked + amount;
      case 'subtract': return Math.max(0, user.current_nctr_locked - amount);
      case 'set': return amount;
    }
  };

  const getProjectedTier = (balance: number): string => {
    if (balance >= TIER_THRESHOLDS.diamond) return 'diamond';
    if (balance >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (balance >= TIER_THRESHOLDS.gold) return 'gold';
    if (balance >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  };

  const handleSubmit = async () => {
    if (!user || !reason.trim() || !unifiedProfile?.id || !adminUnifiedProfile?.id) return;
    
    setIsSubmitting(true);
    try {
      const newBalance = calculateNewBalance();
      const calculatedTier = getProjectedTier(newBalance);
      const finalTier = useManualOverride && overrideTier ? overrideTier : calculatedTier;

      // 1. Update wallet_portfolio for NCTR balance
      const { data: existingPortfolio } = await supabase
        .from('wallet_portfolio')
        .select('id')
        .eq('user_id', unifiedProfile.id)
        .maybeSingle();

      if (existingPortfolio) {
        const { error: portfolioError } = await supabase
          .from('wallet_portfolio')
          .update({ 
            nctr_360_locked: newBalance,
            last_synced_at: new Date().toISOString(),
            sync_source: 'admin_adjustment'
          })
          .eq('user_id', unifiedProfile.id);
        
        if (portfolioError) throw portfolioError;
      }

      // 2. Update tier override if using manual override
      if (useManualOverride && overrideTier) {
        const { error: overrideError } = await supabase
          .from('unified_profiles')
          .update({
            tier_override: overrideTier,
            tier_override_reason: reason,
            tier_override_by: adminUnifiedProfile.id,
            tier_override_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', unifiedProfile.id);
        
        if (overrideError) throw overrideError;
      } else if (!useManualOverride && unifiedProfile.tier_override) {
        // Clear existing override
        const { error: clearError } = await supabase
          .from('unified_profiles')
          .update({
            tier_override: null,
            tier_override_reason: null,
            tier_override_by: null,
            tier_override_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', unifiedProfile.id);
        
        if (clearError) throw clearError;
      }

      // 3. Log the adjustment
      const { error: logError } = await supabase
        .from('admin_nctr_adjustments')
        .insert({
          user_id: unifiedProfile.id,
          admin_id: adminUnifiedProfile.id,
          adjustment_type: adjustmentType,
          amount: amount,
          previous_balance: user.current_nctr_locked,
          new_balance: newBalance,
          previous_tier: user.current_tier,
          new_tier: finalTier,
          lock_duration: adjustmentType === 'add' ? parseInt(lockDuration) : null,
          reason: reason,
        });
      
      if (logError) throw logError;

      // 4. Log admin activity
      await logActivity(
        'adjust_nctr',
        'user',
        user.id,
        {
          user_email: user.email,
          adjustment_type: adjustmentType,
          amount,
          previous_balance: user.current_nctr_locked,
          new_balance: newBalance,
          previous_tier: user.current_tier,
          new_tier: finalTier,
          manual_override: useManualOverride,
          reason,
        }
      );

      toast({
        title: 'NCTR Adjusted',
        description: `${user.display_name || user.email}'s balance updated to ${newBalance.toLocaleString()} NCTR (${TIER_EMOJIS[finalTier]} ${finalTier})`,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Adjustment error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust NCTR. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const newBalance = calculateNewBalance();
  const projectedTier = useManualOverride && overrideTier ? overrideTier : getProjectedTier(newBalance);
  const tierChanged = projectedTier !== user?.current_tier;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Adjust NCTR Balance
          </DialogTitle>
          <DialogDescription>
            Modify locked NCTR for {user?.display_name || user?.email}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="adjust" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="adjust">Adjust Balance</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
              {adjustmentHistory && adjustmentHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1">{adjustmentHistory.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="flex-1 overflow-auto mt-4">
            <div className="space-y-6">
              {/* Current Status Display */}
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold font-mono">{user?.current_nctr_locked?.toLocaleString() || 0} NCTR</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Tier</p>
                    <Badge className="text-lg capitalize mt-1">
                      {TIER_EMOJIS[user?.current_tier || 'bronze']} {user?.current_tier || 'bronze'}
                    </Badge>
                    {unifiedProfile?.tier_override && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ Has manual override</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Adjustment Type */}
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <RadioGroup 
                  value={adjustmentType} 
                  onValueChange={(v) => setAdjustmentType(v as 'add' | 'subtract' | 'set')}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="add" />
                    <Label htmlFor="add" className="font-normal cursor-pointer">Add NCTR</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="subtract" id="subtract" />
                    <Label htmlFor="subtract" className="font-normal cursor-pointer">Subtract NCTR</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="set" id="set" />
                    <Label htmlFor="set" className="font-normal cursor-pointer">Set to specific amount</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (NCTR)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                />
                {/* Quick presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[100, 500, 1000, 2500, 5000, 10000].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(preset)}
                      className="text-xs"
                    >
                      {preset.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Lock Duration (for adding) */}
              {adjustmentType === 'add' && (
                <div className="space-y-2">
                  <Label>Lock Duration</Label>
                  <Select value={lockDuration} onValueChange={(v) => setLockDuration(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="360">360 Days (360LOCK - Full Benefits)</SelectItem>
                      <SelectItem value="180">180 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Adjustment *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Beta tester reward, Customer service adjustment, Contest winner..."
                  rows={2}
                />
              </div>

              {/* Manual Tier Override */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox
                    id="manualOverride"
                    checked={useManualOverride}
                    onCheckedChange={(checked) => setUseManualOverride(!!checked)}
                  />
                  <Label htmlFor="manualOverride" className="font-normal cursor-pointer">
                    Manual tier override (ignore NCTR thresholds)
                  </Label>
                </div>
                
                {useManualOverride && (
                  <div className="space-y-2 pl-6">
                    <Label>Set Tier Directly</Label>
                    <Select value={overrideTier} onValueChange={setOverrideTier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">🥉 Bronze</SelectItem>
                        <SelectItem value="silver">🥈 Silver</SelectItem>
                        <SelectItem value="gold">🥇 Gold</SelectItem>
                        <SelectItem value="platinum">💎 Platinum</SelectItem>
                        <SelectItem value="diamond">👑 Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      This overrides the normal tier calculation. Use sparingly.
                    </p>
                  </div>
                )}
              </div>

              {/* Preview of Changes */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Preview After Adjustment:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">New Balance</p>
                    <p className="text-xl font-bold font-mono">{newBalance.toLocaleString()} NCTR</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Tier</p>
                    <Badge className="capitalize" variant={tierChanged ? 'default' : 'secondary'}>
                      {TIER_EMOJIS[projectedTier]} {projectedTier}
                      {tierChanged && ' ↑'}
                    </Badge>
                    {useManualOverride && (
                      <p className="text-xs text-amber-600 mt-1">Manual override</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px]">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : adjustmentHistory && adjustmentHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentHistory.map((adj: any) => (
                      <TableRow key={adj.id}>
                        <TableCell className="text-sm">
                          {format(new Date(adj.created_at), 'MMM d, yyyy')}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(adj.created_at), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={adj.adjustment_type === 'add' ? 'default' : adj.adjustment_type === 'subtract' ? 'destructive' : 'secondary'}>
                            {adj.adjustment_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {adj.adjustment_type === 'add' ? '+' : adj.adjustment_type === 'subtract' ? '-' : '='}
                          {adj.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {adj.previous_balance?.toLocaleString()} → {adj.new_balance?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {adj.previous_tier !== adj.new_tier ? (
                            <span className="text-sm">
                              {TIER_EMOJIS[adj.previous_tier]} → {TIER_EMOJIS[adj.new_tier]}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm" title={adj.reason}>
                          {adj.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <History className="h-8 w-8 mb-2 opacity-50" />
                  <p>No adjustment history for this user</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !reason.trim() || amount <= 0 || (useManualOverride && !overrideTier)}
          >
            {isSubmitting ? 'Processing...' : 'Apply Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
