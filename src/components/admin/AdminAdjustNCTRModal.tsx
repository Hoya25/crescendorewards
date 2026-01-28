import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { 
  Coins, History, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Plus, Trash2, 
  RefreshCw, Mail, CheckCheck, Clock, Eye, Gift, FileText, Copy 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdjustNCTRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
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

const TIER_LEVELS: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
};

const getTierLevel = (tier: string): number => {
  return TIER_LEVELS[tier.toLowerCase()] || 1;
};

const QUICK_TEMPLATES = [
  { name: '🎁 Beta Reward', amount: 500, type: 'add' as const, reason: 'Beta tester reward' },
  { name: '👥 Referral Bonus', amount: 100, type: 'add' as const, reason: 'Referral program bonus' },
  { name: '🐛 Bug Bounty', amount: 250, type: 'add' as const, reason: 'Bug bounty reward' },
  { name: '⚡ Quick +100', amount: 100, type: 'add' as const, reason: 'Manual adjustment' },
];

const CHAINS = ['Ethereum', 'Base', 'Polygon', 'Arbitrum', 'Solana'];

const TIER_BENEFITS: Record<string, string> = {
  bronze: 'You now have 1 Alliance Partner benefit slot. Start exploring rewards from our partner network!',
  silver: "You've unlocked 2 benefit slots plus access to creator subscriptions — choose your favorite Twitch, YouTube, or Patreon creators!",
  gold: '3 benefit slots unlocked! You now have access to premium partners like Whoop, Audible, and MasterClass.',
  platinum: "4 benefit slots plus premium travel perks like Priority Pass and CLEAR. You're in elite company!",
  diamond: 'Maximum benefits unlocked: 6 slots, exclusive founder calls, governance voting, and concierge service. Welcome to the top!',
};

const LARGE_ADJUSTMENT_THRESHOLD = 5000;

const generateNotificationContent = (tier: string, amount: number, newBalance: number) => {
  const title = `${TIER_EMOJIS[tier] || '🎉'} You've Reached ${tier.charAt(0).toUpperCase() + tier.slice(1)} Status!`;
  
  const message = `Your 360LOCK balance: ${newBalance.toLocaleString()} NCTR (+${amount.toLocaleString()})

${TIER_BENEFITS[tier] || 'Explore your new benefits!'}

Visit your Benefits page to activate your rewards.

Thank you for your commitment to the NCTR Alliance.`;

  return { title, message };
};

// Component to check notification read status
function NotificationReadStatus({ adjustmentId }: { adjustmentId: string }) {
  const { data: notification } = useQuery({
    queryKey: ['notification-status', adjustmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_user_notifications')
        .select('read_at, sent_via')
        .eq('related_adjustment_id', adjustmentId)
        .maybeSingle();
      return data;
    },
    enabled: !!adjustmentId,
  });

  if (!notification) return null;

  return (
    <div className="flex items-center gap-1">
      {notification.read_at ? (
        <Badge variant="secondary" className="text-xs">
          <CheckCheck className="w-3 h-3 mr-1 text-green-600" />
          Read
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs text-amber-600">
          <Clock className="w-3 h-3 mr-1" />
          Unread
        </Badge>
      )}
    </div>
  );
}

export function AdminAdjustNCTRModal({ open, onOpenChange, user, onSuccess }: AdjustNCTRModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity, adminUser } = useAdminRole();

  // Form state
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [amount, setAmount] = useState<number>(0);
  const [lockDuration, setLockDuration] = useState<number>(360);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');
  const [useManualOverride, setUseManualOverride] = useState(false);
  const [overrideTier, setOverrideTier] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification settings
  const [notifyUser, setNotifyUser] = useState(true);
  const [notifyChannels, setNotifyChannels] = useState<string[]>(['in_app']);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');

  // Wallet management
  const [walletsOpen, setWalletsOpen] = useState(false);
  const [primaryWallet, setPrimaryWallet] = useState<string>('');
  const [walletVerified, setWalletVerified] = useState(false);
  const [additionalWallets, setAdditionalWallets] = useState<Array<{ address: string; chain: string }>>([]);

  // Vesting sync
  const [syncWithVesting, setSyncWithVesting] = useState(false);
  const [vestingContract, setVestingContract] = useState<string>('');

  // Duplicate detection & large adjustment confirmation
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [confirmLargeAdjustment, setConfirmLargeAdjustment] = useState(false);

  // Fetch unified profile ID for the user
  const { data: unifiedProfile } = useQuery({
    queryKey: ['unified-profile-for-adjustment', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('unified_profiles')
        .select('id, tier_override, tier_override_reason, primary_wallet_address, wallet_addresses, wallet_verified, onchain_vesting_synced, onchain_vesting_contract')
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

  // Fetch fresh profile data (BUG 3 FIX: always get latest balance)
  const { data: freshProfileData, refetch: refetchProfile } = useQuery({
    queryKey: ['fresh-profile-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
    staleTime: 0, // Always fetch fresh
  });

  // Fetch adjustment history
  const { data: adjustmentHistory, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
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

  // BUG 3 FIX: Use fresh data for display and calculations
  const currentBalance = (freshProfileData as any)?.locked_nctr ?? 
                         (freshProfileData as any)?.nctr_locked ?? 
                         (freshProfileData as any)?.nctr_balance ??
                         user?.current_nctr_locked ?? 
                         0;
  const currentLevel = freshProfileData?.level ?? 1;

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['adjustment-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_adjustment_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAdjustmentType('add');
      setAmount(0);
      setLockDuration(360);
      setCustomDuration('');
      setReason('');
      setAdminNote('');
      setUseManualOverride(false);
      setOverrideTier('');
      setNotifyUser(true);
      setNotifyChannels(['in_app']);
      setNotifyTitle('');
      setNotifyMessage('');
      setWalletsOpen(false);
      setSyncWithVesting(false);
      setVestingContract('');
      setDuplicateWarning(null);
      setConfirmLargeAdjustment(false);
    }
  }, [open]);

  // Auto-populate notification when amount/tier changes
  useEffect(() => {
    if (amount > 0 && user) {
      const newBalance = adjustmentType === 'add' 
        ? user.current_nctr_locked + amount 
        : adjustmentType === 'subtract' 
          ? Math.max(0, user.current_nctr_locked - amount)
          : amount;
      const projectedTier = useManualOverride && overrideTier 
        ? overrideTier 
        : getProjectedTier(newBalance);
      
      // Only auto-update if user hasn't customized the message
      if (notifyTitle === '' || notifyTitle.includes("You've Reached")) {
        const { title, message } = generateNotificationContent(projectedTier, amount, newBalance);
        setNotifyTitle(title);
        setNotifyMessage(message);
      }
    }
  }, [amount, adjustmentType, useManualOverride, overrideTier, user]);

  // Pre-populate from unified profile
  useEffect(() => {
    if (unifiedProfile) {
      if (unifiedProfile.tier_override) {
        setUseManualOverride(true);
        setOverrideTier(unifiedProfile.tier_override);
      }
      if (unifiedProfile.primary_wallet_address) {
        setPrimaryWallet(unifiedProfile.primary_wallet_address);
      }
      if (unifiedProfile.wallet_verified) {
        setWalletVerified(true);
      }
      if (unifiedProfile.wallet_addresses) {
        setAdditionalWallets(unifiedProfile.wallet_addresses as Array<{ address: string; chain: string }>);
      }
      if (unifiedProfile.onchain_vesting_synced) {
        setSyncWithVesting(true);
        setVestingContract(unifiedProfile.onchain_vesting_contract || '');
      }
    }
  }, [unifiedProfile]);

  // Duplicate detection
  useEffect(() => {
    if (amount > 0 && adjustmentHistory && adjustmentHistory.length > 0) {
      const recentAdjustment = adjustmentHistory[0];
      const timeSinceLast = Date.now() - new Date(recentAdjustment.created_at).getTime();
      const hoursSinceLast = timeSinceLast / (1000 * 60 * 60);
      
      // Check if same amount was added in last 24 hours
      if (
        hoursSinceLast < 24 &&
        recentAdjustment.adjustment_type === adjustmentType &&
        Number(recentAdjustment.amount) === amount
      ) {
        setDuplicateWarning(
          `Warning: You made an identical adjustment (${adjustmentType} ${amount.toLocaleString()} NCTR) ${formatDistanceToNow(new Date(recentAdjustment.created_at), { addSuffix: true })}. Are you sure you want to do this again?`
        );
      } else if (hoursSinceLast < 1) {
        setDuplicateWarning(
          `Note: An adjustment was made ${formatDistanceToNow(new Date(recentAdjustment.created_at), { addSuffix: true })}. Please verify you're not duplicating.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [amount, adjustmentType, adjustmentHistory]);

  // Reset large adjustment confirmation when amount changes
  useEffect(() => {
    setConfirmLargeAdjustment(false);
  }, [amount]);

  // BUG 3 FIX: Use fresh data for calculations
  const calculateNewBalance = () => {
    const baseBalance = currentBalance;
    switch (adjustmentType) {
      case 'add': return baseBalance + amount;
      case 'subtract': return Math.max(0, baseBalance - amount);
      case 'set': return amount;
      default: return baseBalance;
    }
  };

  const getProjectedTier = (balance: number): string => {
    if (balance >= TIER_THRESHOLDS.diamond) return 'diamond';
    if (balance >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (balance >= TIER_THRESHOLDS.gold) return 'gold';
    if (balance >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  };

  const getEffectiveLockDuration = (): number => {
    if (customDuration && parseInt(customDuration) > 0) {
      return Math.min(1825, parseInt(customDuration));
    }
    return lockDuration;
  };

  const getLockExpiryDate = (): Date => {
    return addDays(new Date(), getEffectiveLockDuration());
  };

  const formatNotificationMessage = (template: string): string => {
    const newBalance = calculateNewBalance();
    const projectedTier = getProjectedTier(newBalance);
    return template
      .replace('{amount}', amount.toLocaleString())
      .replace('{new_balance}', newBalance.toLocaleString())
      .replace('{new_tier}', projectedTier)
      .replace('{lock_days}', getEffectiveLockDuration().toString());
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setAdjustmentType(template.type);
    setAmount(template.amount);
    setReason(template.reason);
  };

  const addWallet = () => {
    setAdditionalWallets([...additionalWallets, { address: '', chain: 'Ethereum' }]);
  };

  const removeWallet = (index: number) => {
    setAdditionalWallets(additionalWallets.filter((_, i) => i !== index));
  };

  const updateWallet = (index: number, field: 'address' | 'chain', value: string) => {
    const updated = [...additionalWallets];
    updated[index][field] = value;
    setAdditionalWallets(updated);
  };

  // BUG 4 FIX: Refresh button should also refetch profile
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['nctr-adjustments', unifiedProfile?.id] });
    queryClient.invalidateQueries({ queryKey: ['unified-profile-for-adjustment', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['fresh-profile-data', user?.id] });
    refetchHistory();
    refetchProfile();
    toast({ title: 'Data refreshed' });
  };

  const handleSubmit = async () => {
    if (!user || !reason.trim() || !unifiedProfile?.id || !adminUnifiedProfile?.id) return;
    
    // Check for large adjustment confirmation
    const isLarge = amount >= LARGE_ADJUSTMENT_THRESHOLD;
    if (isLarge && !confirmLargeAdjustment) {
      setConfirmLargeAdjustment(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newBalance = calculateNewBalance();
      const calculatedTier = getProjectedTier(newBalance);
      const finalTier = useManualOverride && overrideTier ? overrideTier : calculatedTier;
      const effectiveLockDuration = getEffectiveLockDuration();
      const lockExpiresAt = getLockExpiryDate();
      const newLevel = getTierLevel(finalTier);

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

      // 2. CRITICAL: Update profiles table (this is where the UI reads from)
      // BUG 1 FIX: First fetch profile to check which columns exist
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileFetchError) {
        console.error('Failed to fetch profile:', profileFetchError);
        toast({
          title: 'Warning',
          description: 'Failed to fetch user profile for update. Please verify.',
          variant: 'destructive',
        });
      } else {
        // Build update object based on what columns exist
        const profileUpdate: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        // Check which NCTR column exists and update it
        if ('locked_nctr' in profileData) {
          profileUpdate.locked_nctr = newBalance;
        }
        if ('nctr_locked' in profileData) {
          profileUpdate.nctr_locked = newBalance;
        }
        if ('nctr_balance' in profileData) {
          profileUpdate.nctr_balance = newBalance;
        }
        if ('nctr_360_locked' in profileData) {
          profileUpdate.nctr_360_locked = newBalance;
        }
        
        // Update level/tier if they exist
        if ('level' in profileData) {
          profileUpdate.level = newLevel;
        }
        if ('tier' in profileData) {
          profileUpdate.tier = finalTier;
        }

        const { error: profilesError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id);

        if (profilesError) {
          console.error('Failed to update profiles:', profilesError);
          toast({
            title: 'Warning',
            description: 'Adjustment logged but profile may not have updated. Please verify.',
            variant: 'destructive',
          });
        } else {
          console.log('Profile updated successfully:', profileUpdate);
        }
      }

      // 3. Update unified_profiles crescendo_data for consistency
      const { data: currentUnifiedProfile } = await supabase
        .from('unified_profiles')
        .select('crescendo_data')
        .eq('id', unifiedProfile.id)
        .maybeSingle();

      const crescendoData = (currentUnifiedProfile?.crescendo_data as Record<string, unknown>) || {};
      const updatedCrescendoData = {
        ...crescendoData,
        locked_nctr: newBalance,
        level: newLevel,
        tier: finalTier,
      };

      // 4. Update unified_profiles with tier override, wallet info, and crescendo_data
      const profileUpdate: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        nctr_lock_expires_at: adjustmentType === 'add' ? lockExpiresAt.toISOString() : null,
        nctr_lock_duration_days: adjustmentType === 'add' ? effectiveLockDuration : null,
        primary_wallet_address: primaryWallet || null,
        wallet_addresses: additionalWallets.length > 0 ? additionalWallets : null,
        wallet_verified: walletVerified,
        wallet_verified_at: walletVerified ? new Date().toISOString() : null,
        onchain_vesting_synced: syncWithVesting,
        onchain_vesting_contract: syncWithVesting ? vestingContract : null,
        crescendo_data: updatedCrescendoData,
      };

      if (useManualOverride && overrideTier) {
        profileUpdate.tier_override = overrideTier;
        profileUpdate.tier_override_reason = reason;
        profileUpdate.tier_override_by = adminUnifiedProfile.id;
        profileUpdate.tier_override_at = new Date().toISOString();
      } else if (!useManualOverride && unifiedProfile.tier_override) {
        profileUpdate.tier_override = null;
        profileUpdate.tier_override_reason = null;
        profileUpdate.tier_override_by = null;
        profileUpdate.tier_override_at = null;
      }

      const { error: unifiedProfileError } = await supabase
        .from('unified_profiles')
        .update(profileUpdate)
        .eq('id', unifiedProfile.id);
      
      if (unifiedProfileError) throw unifiedProfileError;

      // 5. Log the adjustment
      const { data: adjustmentData, error: logError } = await supabase
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
          lock_duration: adjustmentType === 'add' ? effectiveLockDuration : null,
          lock_expires_at: adjustmentType === 'add' ? lockExpiresAt.toISOString() : null,
          reason: reason,
          admin_note: adminNote || null,
          notification_sent: notifyUser,
          status: 'completed',
        })
        .select()
        .single();
      
      if (logError) throw logError;

      // 6. Send notification if enabled
      if (notifyUser && adjustmentData) {
        // Insert into admin_user_notifications (uses unified_profile.id)
        const { error: notifError } = await supabase
          .from('admin_user_notifications')
          .insert({
            user_id: unifiedProfile.id, // unified_profiles.id
            admin_id: adminUnifiedProfile.id,
            notification_type: 'nctr_adjustment',
            title: notifyTitle,
            message: formatNotificationMessage(notifyMessage),
            related_adjustment_id: adjustmentData.id,
            sent_via: notifyChannels,
          });
        
        if (notifError) console.error('Failed to send admin_user_notifications:', notifError);

        // Also insert into regular notifications table (uses auth user id)
        const { error: notifError2 } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id, // auth user id for this table
            type: 'nctr_adjustment',
            title: notifyTitle,
            message: formatNotificationMessage(notifyMessage),
            metadata: { adjustment_id: adjustmentData.id }
          });
        
        if (notifError2) console.error('Failed to send to notifications table:', notifError2);
      }

      // 7. Log admin activity
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
          lock_duration: effectiveLockDuration,
          manual_override: useManualOverride,
          notification_sent: notifyUser,
          reason,
        }
      );

      // 8. Invalidate ALL related queries for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['unified-profile'] });
      queryClient.invalidateQueries({ queryKey: ['nctr-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['unified-profile-for-adjustment'] });
      
      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ['admin-users'] });

      toast({
        title: 'NCTR Adjusted',
        description: `${user.display_name || user.email}'s balance updated to ${newBalance.toLocaleString()} NCTR (${TIER_EMOJIS[finalTier]} ${finalTier})`,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Adjustment error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust NCTR. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const newBalance = calculateNewBalance();
  const projectedTier = useManualOverride && overrideTier ? overrideTier : getProjectedTier(newBalance);
  const tierChanged = projectedTier !== user?.current_tier;
  const isLargeAdjustment = amount >= LARGE_ADJUSTMENT_THRESHOLD;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Adjust NCTR Balance
              </DialogTitle>
              <DialogDescription>
                Modify locked NCTR for {user?.display_name || user?.email}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshData}
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              {/* BUG 2 FIX: Copy user info instead of opening wrong profile */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const userInfo = `
User: ${user?.display_name || user?.email}
ID: ${user?.id}
Current NCTR: ${currentBalance.toLocaleString()}
Tier: ${user?.current_tier}
                  `.trim();
                  navigator.clipboard.writeText(userInfo);
                  toast({ title: 'User info copied to clipboard' });
                }}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(`/benefits`, '_blank');
                }}
              >
                <Gift className="w-4 h-4 mr-1" />
                Benefits
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Current Status Banner - Always visible (BUG 3 FIX: uses fresh data) */}
        <div className="bg-muted rounded-lg p-4 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold font-mono">{currentBalance.toLocaleString()} NCTR</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Tier</p>
              <Badge className="text-lg capitalize">
                {TIER_EMOJIS[getProjectedTier(currentBalance)] || '🥉'} Level {currentLevel}
              </Badge>
              {unifiedProfile?.tier_override && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Has manual override</p>
              )}
            </div>
          </div>
          
          {/* Last adjustment info */}
          {adjustmentHistory && adjustmentHistory.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last adjustment: {formatDistanceToNow(new Date(adjustmentHistory[0].created_at), { addSuffix: true })} 
                ({adjustmentHistory[0].adjustment_type} {Number(adjustmentHistory[0].amount)?.toLocaleString()} NCTR)
              </p>
            </div>
          )}
        </div>

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
            <ScrollArea className="h-[calc(60vh-200px)] pr-4">
              <div className="space-y-6">
                {/* Quick Templates */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quick Templates</Label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((template, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        className="text-xs"
                      >
                        {template.name} (+{template.amount})
                      </Button>
                    ))}
                    {templates && templates.length > 0 && templates.map((t: any) => (
                      <Button
                        key={t.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdjustmentType(t.adjustment_type);
                          setAmount(t.amount);
                          setReason(t.name);
                          if (t.lock_duration_days) setLockDuration(t.lock_duration_days);
                          if (t.notification_enabled) {
                            setNotifyUser(true);
                            if (t.notification_title) setNotifyTitle(t.notification_title);
                            if (t.notification_message) setNotifyMessage(t.notification_message);
                          }
                        }}
                        className="text-xs"
                      >
                        {t.name}
                      </Button>
                    ))}
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
                  <div className="space-y-3">
                    <Label>Lock Duration</Label>
                    <div className="flex flex-wrap gap-2">
                      {[30, 90, 180, 360].map((days) => (
                        <Button
                          key={days}
                          type="button"
                          variant={lockDuration === days && !customDuration ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setLockDuration(days); setCustomDuration(''); }}
                        >
                          {days} Days
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="1825"
                        placeholder="Custom days (1-1825)"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="w-48"
                      />
                      <span className="text-sm text-muted-foreground">
                        Expires: {format(getLockExpiryDate(), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {/* Vesting sync */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="vestingSync"
                        checked={syncWithVesting}
                        onCheckedChange={(checked) => setSyncWithVesting(!!checked)}
                      />
                      <Label htmlFor="vestingSync" className="font-normal cursor-pointer text-sm">
                        Syncing with on-chain vesting contract
                      </Label>
                    </div>
                    {syncWithVesting && (
                      <Input
                        placeholder="Vesting contract address (0x...)"
                        value={vestingContract}
                        onChange={(e) => setVestingContract(e.target.value)}
                      />
                    )}
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

                {/* Wallet Management */}
                <Collapsible open={walletsOpen} onOpenChange={setWalletsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      Manage Wallets
                      {walletsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Primary Wallet Address</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="0x..."
                          value={primaryWallet}
                          onChange={(e) => setPrimaryWallet(e.target.value)}
                        />
                        {primaryWallet && (
                          <Button variant="outline" size="icon" asChild>
                            <a
                              href={`https://etherscan.io/address/${primaryWallet}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="walletVerified"
                          checked={walletVerified}
                          onCheckedChange={(checked) => setWalletVerified(!!checked)}
                        />
                        <Label htmlFor="walletVerified" className="font-normal cursor-pointer text-sm">
                          Mark wallet as verified
                        </Label>
                        {walletVerified && <Badge variant="secondary" className="text-xs">✓ Verified</Badge>}
                      </div>
                    </div>

                    {additionalWallets.length > 0 && (
                      <div className="space-y-2">
                        <Label>Additional Wallets</Label>
                        {additionalWallets.map((wallet, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="Wallet address"
                              value={wallet.address}
                              onChange={(e) => updateWallet(index, 'address', e.target.value)}
                              className="flex-1"
                            />
                            <Select
                              value={wallet.chain}
                              onValueChange={(v) => updateWallet(index, 'chain', v)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CHAINS.map((chain) => (
                                  <SelectItem key={chain} value={chain}>{chain}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeWallet(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button type="button" variant="outline" size="sm" onClick={addWallet}>
                      <Plus className="h-4 w-4 mr-1" /> Add Wallet
                    </Button>
                  </CollapsibleContent>
                </Collapsible>

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

                {/* Notification Section */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Notify Member</Label>
                    <Switch checked={notifyUser} onCheckedChange={setNotifyUser} />
                  </div>
                  
                  {notifyUser && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={notifyChannels.includes('in_app')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNotifyChannels([...notifyChannels, 'in_app']);
                              } else {
                                setNotifyChannels(notifyChannels.filter(c => c !== 'in_app'));
                              }
                            }}
                          />
                          <span className="text-sm">In-App</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={notifyChannels.includes('email')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNotifyChannels([...notifyChannels, 'email']);
                              } else {
                                setNotifyChannels(notifyChannels.filter(c => c !== 'email'));
                              }
                            }}
                          />
                          <span className="text-sm">Email</span>
                        </label>
                        <label className="flex items-center gap-2 opacity-50">
                          <Checkbox disabled />
                          <span className="text-sm">Push (Coming Soon)</span>
                        </label>
                      </div>

                      {/* Quick Message Templates */}
                      <div className="space-y-2">
                        <Label className="text-sm">Quick Templates</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const { title, message } = generateNotificationContent(projectedTier, amount, newBalance);
                              setNotifyTitle(title);
                              setNotifyMessage(message);
                            }}
                          >
                            🎉 Status Upgrade
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNotifyTitle('🎁 NCTR Reward Added!');
                              setNotifyMessage(`Great news! ${amount.toLocaleString()} NCTR has been added to your 360LOCK balance as a reward.\n\nNew balance: ${newBalance.toLocaleString()} NCTR\n\nThank you for being part of the NCTR Alliance!`);
                            }}
                          >
                            🎁 Reward
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNotifyTitle('📊 Balance Adjustment');
                              setNotifyMessage(`Your NCTR balance has been adjusted.\n\nChange: ${adjustmentType === 'add' ? '+' : adjustmentType === 'subtract' ? '-' : ''}${amount.toLocaleString()} NCTR\nNew balance: ${newBalance.toLocaleString()} NCTR\n\nIf you have questions, please contact support.`);
                            }}
                          >
                            📊 Adjustment
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNotifyTitle('🏆 Contest Winner!');
                              setNotifyMessage(`Congratulations! You've won ${amount.toLocaleString()} NCTR!\n\nThis reward has been added to your 360LOCK balance, bringing your total to ${newBalance.toLocaleString()} NCTR.\n\nThank you for participating!`);
                            }}
                          >
                            🏆 Contest Winner
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notification Title</Label>
                        <Input
                          value={notifyTitle}
                          onChange={(e) => setNotifyTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Message</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const { title, message } = generateNotificationContent(projectedTier, amount, newBalance);
                              setNotifyTitle(title);
                              setNotifyMessage(message);
                            }}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reset to Default
                          </Button>
                        </div>
                        <Textarea
                          value={notifyMessage}
                          onChange={(e) => setNotifyMessage(e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Tip: Message auto-generates based on tier. Edit freely or click "Reset to Default" to regenerate.
                        </p>
                      </div>

                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-xs font-medium mb-1">Preview:</p>
                        <p className="text-sm font-medium">{notifyTitle || 'No title set'}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{notifyMessage || 'No message set'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Note */}
                <div className="space-y-2">
                  <Label htmlFor="adminNote">Internal Admin Note</Label>
                  <Textarea
                    id="adminNote"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ticket #, approval reference, etc. (not sent to member)"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">For admin reference only - not sent to member</p>
                </div>

                {/* Duplicate Warning */}
                {duplicateWarning && (
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Possible Duplicate
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {duplicateWarning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                  {adjustmentType === 'add' && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-sm text-muted-foreground">Lock Expiry</p>
                      <p className="text-sm font-medium">{format(getLockExpiryDate(), 'MMMM d, yyyy')} ({getEffectiveLockDuration()} days)</p>
                    </div>
                  )}
                </div>

                {/* Large adjustment confirmation */}
                {isLargeAdjustment && confirmLargeAdjustment && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      ⚠️ You are about to {adjustmentType} <strong>{amount.toLocaleString()} NCTR</strong>. 
                      This is a large adjustment. Click the button again to confirm.
                    </p>
                  </div>
                )}

                {/* Large adjustment warning (before confirmation) */}
                {isLargeAdjustment && !confirmLargeAdjustment && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Large Adjustment</p>
                      <p className="text-xs text-amber-600">Adjustments of {LARGE_ADJUSTMENT_THRESHOLD.toLocaleString()}+ NCTR require confirmation.</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[calc(60vh-200px)]">
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
                      <TableHead>Notification</TableHead>
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
                          {Number(adj.amount)?.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {Number(adj.previous_balance)?.toLocaleString()} → {Number(adj.new_balance)?.toLocaleString()}
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
                        <TableCell className="max-w-[150px]">
                          <div>
                            <p className="truncate text-sm" title={adj.reason}>{adj.reason}</p>
                            {adj.admin_note && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs mt-1 cursor-help">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Has note
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{adj.admin_note}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {adj.notification_sent ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="text-xs w-fit">
                                <Mail className="w-3 h-3 mr-1" />
                                Sent
                              </Badge>
                              <NotificationReadStatus adjustmentId={adj.id} />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Not sent</span>
                          )}
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
            {confirmLargeAdjustment ? (
              <>
                <AlertTriangle className="w-4 h-4 mr-1" />
                Confirm {amount.toLocaleString()} NCTR Adjustment
              </>
            ) : (
              isSubmitting ? 'Processing...' : 'Apply Adjustment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
