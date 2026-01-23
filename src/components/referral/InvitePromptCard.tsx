import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Gift, Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReferralSettings } from '@/hooks/useReferralSettings';

type PromptVariant = 'after-claim' | 'low-balance' | 'level-up' | 'empty-state';

interface InvitePromptCardProps {
  variant: PromptVariant;
  tierName?: string;
  onDismiss?: () => void;
}

const PROMPT_CONFIG = {
  'after-claim': {
    icon: Gift,
    title: '🎁 Love this reward?',
    description: 'Invite a friend and you both earn NCTR!',
    buttonText: 'Invite Now',
    gradient: 'from-primary/10 to-primary/5',
    borderColor: 'border-primary/30',
  },
  'low-balance': {
    icon: Sparkles,
    title: 'Need more Claims?',
    description: 'Invite friends to earn bonus Claims!',
    buttonText: 'Invite & Earn',
    gradient: 'from-amber-500/10 to-orange-500/5',
    borderColor: 'border-amber-500/30',
  },
  'level-up': {
    icon: Trophy,
    title: '🎉 Congratulations on leveling up!',
    description: 'Invite friends to climb even faster.',
    buttonText: 'Share Your Success',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    borderColor: 'border-emerald-500/30',
  },
  'empty-state': {
    icon: UserPlus,
    title: 'Get started with referrals',
    description: 'Invite friends and earn rewards together!',
    buttonText: 'Start Inviting',
    gradient: 'from-primary/10 to-primary/5',
    borderColor: 'border-primary/30',
  },
};

export function InvitePromptCard({ variant, tierName, onDismiss }: InvitePromptCardProps) {
  const navigate = useNavigate();
  const { data: settings } = useReferralSettings();
  const allocation = settings?.allocation360Lock ?? 500;
  const config = PROMPT_CONFIG[variant];
  const Icon = config.icon;

  const handleClick = () => {
    navigate('/invite');
  };

  // Customize description for level-up
  let description = config.description;
  if (variant === 'level-up' && tierName) {
    description = `You reached ${tierName}! Invite friends to climb even faster.`;
  }

  return (
    <Card className={`bg-gradient-to-r ${config.gradient} border-2 ${config.borderColor} overflow-hidden`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base">{config.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
            <p className="text-xs text-primary font-medium mt-1">
              +{allocation} NCTR per friend
            </p>
          </div>
          <Button onClick={handleClick} size="sm" className="shrink-0">
            {config.buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
