import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Camera, User, FileText, Wallet, Gift, ChevronRight } from 'lucide-react';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import type { Profile } from '@/types';

interface ProfileCompletionProps {
  profile: Profile;
  onAvatarClick?: () => void;
  onNameClick?: () => void;
  onBioClick?: () => void;
  onWalletClick?: () => void;
}

interface CompletionItemDisplay {
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
  const { percentage, completedCount, totalCount, items, isComplete, loading } = useProfileCompletion(profile);

  const iconMap: Record<string, React.ReactNode> = {
    avatar: <Camera className="w-4 h-4" />,
    name: <User className="w-4 h-4" />,
    bio: <FileText className="w-4 h-4" />,
    wallet: <Wallet className="w-4 h-4" />,
    reward: <Gift className="w-4 h-4" />,
  };

  const actionMap: Record<string, { action?: () => void; label: string }> = {
    avatar: { action: onAvatarClick, label: 'Upload' },
    name: { action: onNameClick, label: 'Add' },
    bio: { action: onBioClick, label: 'Add' },
    wallet: { action: onWalletClick, label: 'Connect' },
    reward: { action: () => navigate('/rewards'), label: 'Browse' },
  };

  const displayItems: CompletionItemDisplay[] = items.map(item => ({
    ...item,
    icon: iconMap[item.id],
    action: actionMap[item.id]?.action,
    actionLabel: actionMap[item.id]?.label,
  }));

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
  if (isComplete) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              Profile Complete!
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Profile Completion</CardTitle>
          <Badge variant="secondary">
            {percentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completedCount} of {totalCount} completed
          </p>
        </div>

        <div className="space-y-2">
          {displayItems.map((item) => (
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
                    ? 'bg-primary/10 text-primary' 
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
                <Badge variant="outline" className="text-primary border-primary/30">
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
