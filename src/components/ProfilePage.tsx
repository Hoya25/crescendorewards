import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Save, User, Mail, Wallet, Code, Shield, LogOut, Link2, Unlink, RefreshCw, ExternalLink } from 'lucide-react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { BuyClaims } from '@/components/BuyClaims';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useNCTRBalance } from '@/hooks/useNCTRBalance';
import { getMembershipTierByNCTR } from '@/utils/membershipLevels';
import { validateImageFile } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  level: number;
  locked_nctr: number;
  available_nctr: number;
  claim_balance: number;
  referral_code: string | null;
  has_claimed_signup_bonus: boolean;
  has_status_access_pass: boolean;
  wallet_address: string | null;
  avatar_url: string | null;
}

interface ProfilePageProps {
  profile: Profile;
  onBack: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
}

export function ProfilePage({ profile, onBack, onSignOut, onRefresh }: ProfilePageProps) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [walletAddress, setWalletAddress] = useState(profile.wallet_address || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const { address, isConnected, linkWalletToAccount } = useWalletAuth();
  const [linkingWallet, setLinkingWallet] = useState(false);
  const { balance: walletNCTRBalance, formattedBalance, isLoading: isLoadingBalance, contractAddress, refetch: refetchBalance } = useNCTRBalance();

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
          await supabase.storage.from('avatars').remove([`${profile.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

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

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: 'Success',
        description: 'Avatar updated successfully',
      });
      onRefresh();
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

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      onRefresh();
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
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setLinkingWallet(true);
    try {
      const success = await linkWalletToAccount(profile.id);
      if (success) {
        setWalletAddress(address);
        onRefresh();
      }
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleUnlinkWallet = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: null })
        .eq('id', profile.id);

      if (error) throw error;

      setWalletAddress('');
      toast({
        title: 'Success',
        description: 'Wallet unlinked successfully',
      });
      onRefresh();
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
    return profile.email?.[0]?.toUpperCase() || 'U';
  };

  const membershipTier = getMembershipTierByNCTR(profile.locked_nctr);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Stats */}
          <div className="space-y-6">
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

            {/* Membership Level Card */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tier</span>
                  <Badge className="text-base">{membershipTier.name}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Multiplier</span>
                  <span className="text-lg font-bold">{membershipTier.multiplier}x</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Locked NCTR</span>
                    <span className="font-semibold">{profile.locked_nctr.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available NCTR</span>
                    <span className="font-semibold">{profile.available_nctr.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Claim Passes</span>
                    <span className="font-semibold">{profile.claim_balance.toLocaleString()}</span>
                  </div>
                </div>
                <BuyClaims 
                  currentBalance={profile.claim_balance} 
                  onPurchaseSuccess={onRefresh}
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
                  <CardDescription>
                    NCTR tokens in your Base wallet
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
                            {(walletNCTRBalance + profile.available_nctr + profile.locked_nctr).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          = Wallet ({walletNCTRBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}) + Available ({profile.available_nctr.toLocaleString()}) + Locked ({profile.locked_nctr.toLocaleString()})
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Connect your wallet to view balance
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
                                  Connect Wallet
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
                    value={profile.email || ''}
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
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
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
                                  Connect Base Wallet
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
                        Connect your Base wallet for seamless authentication
                      </p>
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

            {/* Referral Information */}
            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Share your code and earn rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="referralCode" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Your Referral Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="referralCode"
                      value={profile.referral_code || 'Loading...'}
                      readOnly
                      className="bg-muted font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (profile.referral_code) {
                          navigator.clipboard.writeText(profile.referral_code);
                          toast({
                            title: 'Copied!',
                            description: 'Referral code copied to clipboard',
                          });
                        }
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                {profile.has_claimed_signup_bonus && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-600" />
                    Signup bonus claimed
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={onSignOut} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
