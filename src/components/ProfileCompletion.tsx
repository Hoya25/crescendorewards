import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Camera, User, FileText, Wallet, Gift, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';

interface ProfileCompletionProps {
  profile: Profile;
  onAvatarClick?: () => void;
  onNameClick?: () => void;
  onBioClick?: () => void;
  onWalletClick?: () => void;
}

interface CompletionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isComplete: boolean;
  weight: number;
  action?: () => void;
  actionLabel?: string;
}

export function ProfileCompletion({ 
  profile, 
  onAvatarClick, 
  onNameClick, 
  onBioClick,
  onWalletClick 
}: ProfileCompletionProps) {
  const navigate = useNavigate();
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRewardClaims = async () => {
      if (!profile?.id) return;
      
      try {
        const { count, error } = await supabase
          .from('rewards_claims')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        if (error) throw error;
        setHasClaimedReward((count ?? 0) > 0);
      } catch (error) {
        console.error('Error checking reward claims:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRewardClaims();
  }, [profile?.id]);

  const completionItems: CompletionItem[] = [
    {
      id: 'avatar',
      label: 'Upload avatar',
      icon: <Camera className="w-4 h-4" />,
      isComplete: !!profile.avatar_url,
      weight: 20,
      action: onAvatarClick,
      actionLabel: 'Upload',
    },
    {
      id: 'name',
      label: 'Set display name',
      icon: <User className="w-4 h-4" />,
      isComplete: !!profile.full_name && profile.full_name.trim().length > 0,
      weight: 20,
      action: onNameClick,
      actionLabel: 'Add',
    },
    {
      id: 'bio',
      label: 'Add bio',
      icon: <FileText className="w-4 h-4" />,
      isComplete: !!profile.bio && profile.bio.trim().length > 0,
      weight: 20,
      action: onBioClick,
      actionLabel: 'Add',
    },
    {
      id: 'wallet',
      label: 'Connect wallet',
      icon: <Wallet className="w-4 h-4" />,
      isComplete: !!profile.wallet_address,
      weight: 20,
      action: onWalletClick,
      actionLabel: 'Connect',
    },
    {
      id: 'reward',
      label: 'Claim first reward',
      icon: <Gift className="w-4 h-4" />,
      isComplete: hasClaimedReward,
      weight: 20,
      action: () => navigate('/rewards'),
      actionLabel: 'Browse',
    },
  ];

  const completedWeight = completionItems
    .filter(item => item.isComplete)
    .reduce((sum, item) => sum + item.weight, 0);

  const completedCount = completionItems.filter(item => item.isComplete).length;
  const totalCount = completionItems.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if profile is 100% complete
  if (completedWeight === 100) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Profile Complete!
            </CardTitle>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              100%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={100} className="h-2" />
          <p className="text-sm text-muted-foreground mt-3">
            Great job! Your profile is fully set up.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Profile Completion</CardTitle>
          <Badge variant="secondary">
            {completedWeight}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Progress value={completedWeight} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completedCount} of {totalCount} completed
          </p>
        </div>

        <div className="space-y-2">
          {completionItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                item.isComplete 
                  ? 'bg-muted/30 border-transparent' 
                  : 'bg-background border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  item.isComplete 
                    ? 'bg-green-500/10 text-green-600' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {item.isComplete ? <Check className="w-4 h-4" /> : item.icon}
                </div>
                <span className={`text-sm font-medium ${
                  item.isComplete ? 'text-muted-foreground line-through' : ''
                }`}>
                  {item.label}
                </span>
              </div>
              
              {!item.isComplete && item.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={item.action}
                  className="gap-1 text-primary hover:text-primary"
                >
                  {item.actionLabel}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              
              {item.isComplete && (
                <Badge variant="outline" className="text-green-600 border-green-500/30">
                  +{item.weight}%
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
