import { Button } from '@/components/ui/button';
import { UserPlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReferralSettings } from '@/hooks/useReferralSettings';

export function InviteHeaderCTA() {
  const navigate = useNavigate();
  const { data: settings } = useReferralSettings();
  const allocation = settings?.allocation360Lock ?? 500;

  return (
    <Button
      onClick={() => navigate('/invite')}
      variant="outline"
      size="sm"
      className="hidden md:flex gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary"
    >
      <UserPlus className="w-4 h-4" />
      <span className="hidden lg:inline">Invite & Earn</span>
      <span className="font-semibold">{allocation} NCTR</span>
      <Sparkles className="w-3 h-3 text-amber-500" />
    </Button>
  );
}
