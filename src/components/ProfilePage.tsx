import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { NCTRLogo } from './NCTRLogo';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Save, User, Mail, Wallet, Shield, LogOut, Link2, Unlink, RefreshCw, ExternalLink, Heart, Gift, X, Crown, ChevronRight, FileText, Check, Lock, TrendingUp, Sparkles, Truck, Package, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationPreferences } from '@/components/profile/NotificationPreferences';
import { CompactReferralCard } from '@/components/referral/CompactReferralCard';
import { Progress } from '@/components/ui/progress';
import { useAdminRole } from '@/hooks/useAdminRole';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { BuyClaims } from '@/components/BuyClaims';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useNCTRBalance } from '@/hooks/useNCTRBalance';
import { getMembershipTierByNCTR } from '@/utils/membershipLevels';
import { validateImageFile } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { NoWishlistItemsEmpty } from '@/components/EmptyState';
import { ProfilePageSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { ProfileCompletion } from '@/components/ProfileCompletion';
import type { Profile } from '@/types';
import { useDeliveryProfile } from '@/hooks/useDeliveryProfile';
import { PortfolioSummaryCard } from '@/components/PortfolioSummaryCard';
import { ProfileActivityStats } from '@/components/profile/ProfileActivityStats';
import { GroundballStatusBadge } from '@/components/groundball/GroundballStatusBadge';
const getCrescendoData = (profile: any) => {
  const crescendoData = profile?.crescendo_data || {};
  return {
    locked_nctr: crescendoData.locked_nctr || 0,
    available_nctr: crescendoData.available_nctr || 0,
    claim_balance: crescendoData.claims_balance || crescendoData.claim_balance || 0,
    referral_code: crescendoData.referral_code || null,
    has_claimed_signup_bonus: crescendoData.has_claimed_signup_bonus || false,
  };
};

// Adapter to convert UnifiedProfile to Profile format for components
const toProfileFormat = (unifiedProfile: any): Profile | null => {
  if (!unifiedProfile) return null;
  const crescendoData = getCrescendoData(unifiedProfile);
  return {
    id: unifiedProfile.id,
    email: unifiedProfile.email,
    full_name: unifiedProfile.display_name,
    bio: unifiedProfile.crescendo_data?.bio || '',
    avatar_url: unifiedProfile.avatar_url,
    wallet_address: unifiedProfile.wallet_address,
    level: crescendoData.locked_nctr > 0 ? 1 : 0,
    locked_nctr: crescendoData.locked_nctr,
    available_nctr: crescendoData.available_nctr,
    claim_balance: crescendoData.claim_balance,
    referral_code: crescendoData.referral_code,
    referred_by: null,
    has_claimed_signup_bonus: crescendoData.has_claimed_signup_bonus,
    has_status_access_pass: false,
    created_at: unifiedProfile.created_at,
    updated_at: unifiedProfile.updated_at,
  };
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();
  const { profile: unifiedProfile, refreshUnifiedProfile, updateUnifiedProfile, tier, nextTier, progressToNextTier, total360Locked } = useUnifiedUser();
  const { isAdmin } = useAdminRole();
  
  // Convert to Profile format for compatibility
  const profile = toProfileFormat(unifiedProfile);
  const crescendoData = getCrescendoData(unifiedProfile);
  
  const [fullName, setFullName] = useState(unifiedProfile?.display_name || '');
  const [bio, setBio] = useState(unifiedProfile?.crescendo_data?.bio || '');
  const [walletAddress, setWalletAddress] = useState(unifiedProfile?.wallet_address || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(unifiedProfile?.avatar_url);
  const { address, isConnected, linkWalletToAccount } = useWalletAuth();
  const [linkingWallet, setLinkingWallet] = useState(false);
  const { balance: walletNCTRBalance, formattedBalance, isLoading: isLoadingBalance, contractAddress, refetch: refetchBalance } = useNCTRBalance();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  
  // Refs for scrolling to sections
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);
  const walletSectionRef = useRef<HTMLDivElement>(null);

  // Load wishlist items - must be before early return
  useEffect(() => {
    if (unifiedProfile?.id) {
      loadWishlist();
    }
  }, [unifiedProfile?.id]);

  const loadWishlist = async () => {
    if (!unifiedProfile?.id) return;
    try {
      setLoadingWishlist(true);
      const { data, error } = await supabase
        .rpc('get_user_wishlist', { p_user_id: unifiedProfile.id });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoadingWishlist(false);
    }
  };
  
  if (!unifiedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
              <h1 className="text-2xl font-bold">My Account</h1>
              <p className="text-sm text-muted-foreground">Manage your profile, status, and preferences</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <ProfilePageSkeleton />
        </div>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: 'Error',
        description: validation.error,
        variant: 'destructive',
      });
      e.target.value = ''; // Reset file input
      return;
    }

    try {
      setUploading(true);

      // Compress image before upload
      const { file: compressedFile, originalSize, compressedSize } = 
        await compressImageWithStats(file);

      if (compressedSize < originalSize) {
        toast({
          title: 'Image Compressed',
          description: `Reduced from ${formatBytes(originalSize)} to ${formatBytes(compressedSize)}`,
        });
      }

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${unifiedProfile.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${unifiedProfile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update unified profile
      await updateUnifiedProfile({ avatar_url: publicUrl });

      setAvatarUrl(publicUrl);
      toast({
        title: 'Success',
        description: 'Avatar updated successfully',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      await updateUnifiedProfile({
        display_name: fullName,
        crescendo_data: {
          ...unifiedProfile.crescendo_data,
          bio: bio,
        },
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Error',
        description: 'Please link your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setLinkingWallet(true);
    try {
      const success = await linkWalletToAccount(unifiedProfile.id);
      if (success) {
        setWalletAddress(address);
        await refreshUnifiedProfile();
      }
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleUnlinkWallet = async () => {
    try {
      setSaving(true);
      await updateUnifiedProfile({ wallet_address: null });

      setWalletAddress('');
      toast({
        title: 'Success',
        description: 'Wallet unlinked successfully',
      });
    } catch (error: any) {
      console.error('Error unlinking wallet:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlink wallet',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return unifiedProfile.email?.[0]?.toUpperCase() || 'U';
  };

  const membershipTier = getMembershipTierByNCTR(crescendoData.locked_nctr);

  const handleRemoveFromWishlist = async (wishlistId: string, rewardTitle: string) => {
    try {
      const { error } = await supabase
        .from('reward_wishlists')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;

      setWishlistItems(prev => prev.filter(item => item.wishlist_id !== wishlistId));

      toast({
        title: 'Removed from wishlist',
        description: `${rewardTitle} removed from your wishlist`,
      });
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item from wishlist',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Account</h1>
              <p className="text-sm text-muted-foreground">Manage your profile, status, and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Stats */}
          <div className="space-y-6">
            {/* Profile Completion Card */}
            <ProfileCompletion 
              profile={profile}
              onAvatarClick={() => avatarInputRef.current?.click()}
              onNameClick={() => {
                nameInputRef.current?.focus();
                nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              onBioClick={() => {
                bioInputRef.current?.focus();
                bioInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              onWalletClick={() => {
                walletSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            />
            {/* Avatar Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your avatar</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="w-32 h-32">
                    {avatarUrl ? (
                      <ImageWithFallback
                        src={avatarUrl}
                        alt={fullName || 'User avatar'}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-3xl">{getInitials()}</AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Click to upload (Max 2MB)
                  <br />
                  JPG, PNG, WEBP
                </p>
              </CardContent>
            </Card>

            {/* GROUNDBALL Status Badge */}
            <GroundballStatusBadge size="lg" showProgress showSelections />

            {/* Your Status Benefits Card */}
            <Card 
              className="overflow-hidden border-2"
              style={{ 
                borderColor: tier?.badge_color ? `${tier.badge_color}30` : 'hsl(var(--border))'
              }}
            >
              <CardHeader 
                className="pb-3"
                style={{ 
                  background: tier?.badge_color 
                    ? `linear-gradient(135deg, ${tier.badge_color}15, ${tier.badge_color}05)` 
                    : undefined 
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tier?.badge_emoji || '🥉'}</span>
                    <div>
                      <CardTitle 
                        className="text-lg"
                        style={{ color: tier?.badge_color }}
                      >
                        {tier?.display_name || 'Bronze'}
                      </CardTitle>
                      <CardDescription>Your current status</CardDescription>
                    </div>
                  </div>
                  {nextTier ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/membership')}
                      className="gap-1"
                    >
                      Upgrade
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Badge className="bg-[hsl(var(--accent-lime))]/15 text-[hsl(var(--accent-lime))] border-[hsl(var(--accent-lime))]/30 font-semibold">
                      MAX STATUS
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                {/* 360LOCK Progress */}
                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      360LOCK Amount
                    </span>
                    <span className="font-bold">{total360Locked.toLocaleString()} NCTR</span>
                  </div>
                  
                  {nextTier && (
                    <div className="space-y-1.5">
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${progressToNextTier}%`,
                            background: `linear-gradient(90deg, ${tier?.badge_color || 'hsl(var(--primary))'}, ${nextTier?.badge_color || 'hsl(var(--primary))'})`,
                            animation: 'progress-fill 1.5s ease-out forwards'
                          }}
                        />
                        {/* Shimmer effect */}
                        <div 
                          className="absolute inset-0 opacity-30"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            animation: 'shimmer 2s infinite',
                            animationDelay: '1s'
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{Math.round(progressToNextTier)}% to next level</span>
                        <span className="flex items-center gap-1">
                          <span>{nextTier.badge_emoji}</span>
                          {nextTier.display_name}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {!nextTier && (
                    <div 
                      className="flex items-center gap-2 text-xs p-2 rounded-lg animate-pulse"
                      style={{ backgroundColor: `${tier?.badge_color}10` }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: tier?.badge_color }} />
                      <span style={{ color: tier?.badge_color }}>Maximum status achieved!</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Monthly Claims Allocation */}
                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5" />
                      Monthly Claims
                    </span>
                    <span className="font-bold">
                      {(tier?.claims_per_month || 0)}/month
                    </span>
                  </div>
                  {nextTier && (nextTier.claims_per_month || 0) > (tier?.claims_per_month || 0) && (
                    <p 
                      className="text-xs flex items-center gap-1 cursor-pointer hover:underline"
                      style={{ color: nextTier.badge_color || 'hsl(var(--muted-foreground))' }}
                      onClick={() => navigate('/membership')}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {nextTier.display_name} members get {nextTier.claims_per_month}/month
                    </p>
                  )}
                </div>

                <Separator />

                {/* Benefits List with staggered animations */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    Your Benefits
                  </p>
                  <ul className="space-y-2">
                    {(tier?.benefits || [
                      'Access to basic rewards',
                      'Earn 1x NCTR on activities',
                      'Community access'
                    ]).slice(0, 5).map((benefit, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-start gap-2 text-sm animate-fade-in opacity-0"
                        style={{ 
                          animationDelay: `${0.3 + idx * 0.1}s`,
                          animationFillMode: 'forwards'
                        }}
                      >
                        <div 
                          className="w-4 h-4 mt-0.5 shrink-0 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                          style={{ 
                            backgroundColor: `${tier?.badge_color || 'hsl(var(--primary))'}20`
                          }}
                        >
                          <Check 
                            className="w-3 h-3" 
                            style={{ color: tier?.badge_color || 'hsl(var(--primary))' }}
                          />
                        </div>
                        <span className="transition-colors hover:text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Tier Preview */}
                {nextTier && nextTier.benefits && nextTier.benefits.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        {nextTier.display_name} Unlocks
                      </p>
                      <ul className="space-y-2">
                        {nextTier.benefits.slice(0, 2).map((benefit, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-start gap-2 text-sm opacity-50 hover:opacity-80 transition-opacity cursor-pointer group"
                            onClick={() => navigate('/membership')}
                          >
                            <div className="w-4 h-4 mt-0.5 shrink-0 rounded-full flex items-center justify-center bg-muted group-hover:bg-muted/80 transition-colors">
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground">
                        Commit {(nextTier.min_nctr_360_locked - total360Locked).toLocaleString()} more NCTR to unlock
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Balance Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available NCTR</span>
                    <span className="font-semibold">{crescendoData.available_nctr.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Claim Passes</span>
                    <span className="font-semibold">{crescendoData.claim_balance.toLocaleString()}</span>
                  </div>
                </div>
                
                <BuyClaims 
                  currentBalance={crescendoData.claim_balance} 
                  onPurchaseSuccess={refreshUnifiedProfile}
                  trigger={
                    <Button className="w-full gap-2" variant="default">
                      Buy Claim Passes
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            {/* Wallet NCTR Balance */}
            {walletAddress && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Wallet Balance
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetchBalance()}
                      disabled={isLoadingBalance}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <NCTRLogo size="xs" /> tokens in your Base wallet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isConnected ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Wallet NCTR</span>
                          <span className="text-2xl font-bold">
                            {isLoadingBalance ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              `${parseFloat(formattedBalance).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}`
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Contract</span>
                          <a
                            href={`https://basescan.org/token/${contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline font-mono"
                          >
                            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total NCTR</span>
                          <span className="font-semibold">
                            {(walletNCTRBalance + crescendoData.available_nctr + crescendoData.locked_nctr).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          = Wallet ({walletNCTRBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}) + Available ({crescendoData.available_nctr.toLocaleString()}) + Locked ({crescendoData.locked_nctr.toLocaleString()})
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Link your wallet to view balance
                      </p>
                      <ConnectButton.Custom>
                        {({
                          account,
                          chain,
                          openConnectModal,
                          mounted,
                        }) => {
                          const ready = mounted;
                          const connected = ready && account && chain;

                          return (
                            <div
                              {...(!ready && {
                                'aria-hidden': true,
                                style: {
                                  opacity: 0,
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                },
                              })}
                            >
                              {!connected && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={openConnectModal}
                                >
                                  <Wallet className="mr-2 h-4 w-4" />
                                   Link Wallet
                                </Button>
                              )}
                            </div>
                          );
                        }}
                      </ConnectButton.Custom>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Wishlist Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    My Wishlist
                  </CardTitle>
                  <Badge variant="secondary">{wishlistItems.length}</Badge>
                </div>
                <CardDescription>Your saved rewards</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingWishlist ? (
                  <div className="space-y-2">
                    <div className="h-16 bg-muted animate-pulse rounded" />
                    <div className="h-16 bg-muted animate-pulse rounded" />
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No items in your wishlist yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wishlistItems.slice(0, 3).map((item) => (
                      <div
                        key={item.wishlist_id}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors relative"
                      >
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {item.reward_image ? (
                            <ImageWithFallback
                              src={item.reward_image}
                              alt={item.reward_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gift className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.reward_title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.reward_cost} Claims
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFromWishlist(item.wishlist_id, item.reward_title)}
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                    
                    {wishlistItems.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{wishlistItems.length - 3} more items
                      </p>
                    )}
                  </div>
                )}
                
                {wishlistItems.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4 gap-2"
                    onClick={() => navigate('/wishlist')}
                  >
                    <Heart className="w-4 h-4" />
                    View Full Wishlist
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* NCTR Overview */}
            <PortfolioSummaryCard showLink={true} />
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Profile
                  </CardTitle>
                </div>
                <CardDescription>Manage your delivery preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your delivery profile for faster reward claims
                </p>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => navigate('/profile/delivery')}
                >
                  <Package className="w-4 h-4" />
                  Manage Delivery Info
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <NotificationPreferences />

            {isAdmin && (
              <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Admin Access</CardTitle>
                      <CardDescription>You have administrator privileges</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => navigate('/admin')}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Open Admin Panel
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Activity Stats */}
            <ProfileActivityStats />
          </div>

          {/* Right Column - Account Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={unifiedProfile.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    ref={nameInputRef}
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    ref={bioInputRef}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500 characters
                  </p>
                </div>

                <div className="space-y-2" ref={walletSectionRef}>
                  <Label htmlFor="wallet" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Base Wallet
                  </Label>
                  
                  {walletAddress ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="wallet"
                          type="text"
                          value={walletAddress}
                          disabled
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUnlinkWallet}
                          disabled={saving}
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Connected Base wallet address
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ConnectButton.Custom>
                        {({
                          account,
                          chain,
                          openConnectModal,
                          mounted,
                        }) => {
                          const ready = mounted;
                          const connected = ready && account && chain;

                          return (
                            <div
                              {...(!ready && {
                                'aria-hidden': true,
                                style: {
                                  opacity: 0,
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                },
                              })}
                            >
                              {!connected ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full"
                                  onClick={openConnectModal}
                                >
                                  <Wallet className="mr-2 h-4 w-4" />
                                  Link Base Wallet
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="default"
                                  className="w-full"
                                  onClick={handleLinkWallet}
                                  disabled={linkingWallet}
                                >
                                  <Link2 className="mr-2 h-4 w-4" />
                                  {linkingWallet ? 'Linking...' : 'Link Wallet to Profile'}
                                </Button>
                              )}
                            </div>
                          );
                        }}
                      </ConnectButton.Custom>
                      <p className="text-xs text-muted-foreground">
                        Link your Base wallet for seamless authentication
                      </p>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
                              <HelpCircle className="w-3 h-3" />
                              <span>What's a wallet?</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[260px] text-center">
                            <p className="text-xs">Your account is secured by a digital wallet — think of it like a username and password, but more secure. We'll walk you through it.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Referral Invite Card */}
            <CompactReferralCard variant="featured" className="lg:col-span-1" />

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={signOut} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Bottom padding for mobile nav */}
        <div className="h-20 md:hidden" />
      </div>
    </div>
  );
}
